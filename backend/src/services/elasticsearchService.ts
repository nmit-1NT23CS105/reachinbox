import { Client } from '@elastic/elasticsearch';
import { prisma } from '../db/prisma';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
export const EMAIL_INDEX = 'reachinbox_emails';

export let esClient: Client | null = null;
export let isElasticsearchAvailable = false;

export async function initElasticsearch(): Promise<boolean> {
    try {
        esClient = new Client({
            node: ELASTICSEARCH_URL,
            maxRetries: 2,
            requestTimeout: 3000,
        });

        const health = await (esClient as any).cluster.health({});
        console.log(`[Elasticsearch] Connected successfully to cluster status: ${health.status}`);
        isElasticsearchAvailable = true;

        await ensureEmailIndex();
        return true;
    } catch (err: any) {
        console.warn(`[Elasticsearch] Elasticsearch not reachable at ${ELASTICSEARCH_URL} (${err.message}). Safe PostgreSQL fallback will be active.`);
        isElasticsearchAvailable = false;
        return false;
    }
}

export async function ensureEmailIndex(): Promise<void> {
    if (!esClient || !isElasticsearchAvailable) return;
    try {
        const exists = await (esClient as any).indices.exists({ index: EMAIL_INDEX });
        if (!exists) {
            console.log(`[Elasticsearch] Creating index "${EMAIL_INDEX}" with search mappings...`);
            await (esClient as any).indices.create({
                index: EMAIL_INDEX,
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        campaignId: { type: 'keyword' },
                        userId: { type: 'keyword' },
                        senderId: { type: 'keyword' },
                        senderEmail: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                        senderName: { type: 'text' },
                        recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                        recipientName: { type: 'text' },
                        subject: { type: 'text' },
                        body: { type: 'text' },
                        status: { type: 'keyword' },
                        scheduledAt: { type: 'date' },
                        sentAt: { type: 'date' },
                        createdAt: { type: 'date' },
                        previewUrl: { type: 'keyword' },
                    },
                },
            });
            console.log(`[Elasticsearch] Index "${EMAIL_INDEX}" created successfully.`);
        }
    } catch (err: any) {
        console.warn(`[Elasticsearch] Index creation check failed:`, err.message);
    }
}

export interface EmailIndexDoc {
    id: string;
    campaignId: string;
    userId?: string;
    senderId: string;
    senderEmail?: string;
    senderName?: string;
    recipient: string;
    recipientName?: string | null;
    subject: string;
    body: string;
    status: string;
    scheduledAt: Date | string;
    sentAt?: Date | string | null;
    createdAt?: Date | string;
    previewUrl?: string | null;
}

export async function indexEmailJob(doc: EmailIndexDoc): Promise<boolean> {
    if (!esClient || !isElasticsearchAvailable) return false;
    try {
        await (esClient as any).index({
            index: EMAIL_INDEX,
            id: doc.id,
            document: {
                id: doc.id,
                campaignId: doc.campaignId,
                userId: doc.userId,
                senderId: doc.senderId,
                senderEmail: doc.senderEmail,
                senderName: doc.senderName,
                recipient: doc.recipient,
                recipientName: doc.recipientName,
                subject: doc.subject,
                body: doc.body ? doc.body.replace(/<[^>]*>?/gm, ' ').substring(0, 5000) : '',
                status: doc.status.toUpperCase(),
                scheduledAt: new Date(doc.scheduledAt).toISOString(),
                sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : null,
                createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
                previewUrl: doc.previewUrl,
            },
            refresh: 'wait_for',
        });
        return true;
    } catch (err: any) {
        console.warn(`[Elasticsearch] Failed to index job ${doc.id}:`, err.message);
        return false;
    }
}

export interface SearchElasticsearchParams {
    query: string;
    status?: string | string[];
    userId?: string;
    page?: number;
    limit?: number;
}

export interface ElasticsearchSearchResult {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: any[];
}

export async function searchElasticsearchEmails(
    params: SearchElasticsearchParams
): Promise<ElasticsearchSearchResult | null> {
    if (!esClient || !isElasticsearchAvailable) {
        return null; // Signals caller to fall back to DB search
    }

    try {
        const page = params.page && params.page > 0 ? params.page : 1;
        const limit = params.limit && params.limit > 0 ? params.limit : 20;
        const from = (page - 1) * limit;

        const mustClauses: any[] = [];
        const filterClauses: any[] = [];

        if (params.query && params.query.trim()) {
            mustClauses.push({
                multi_match: {
                    query: params.query.trim(),
                    fields: ['subject^3', 'recipient^2', 'recipientName^2', 'body', 'senderEmail'],
                    fuzziness: 'AUTO',
                },
            });
        } else {
            mustClauses.push({ match_all: {} });
        }

        if (params.status) {
            const statuses = Array.isArray(params.status) ? params.status : [params.status];
            filterClauses.push({
                terms: { status: statuses.map((s) => s.toUpperCase()) },
            });
        }

        if (params.userId) {
            filterClauses.push({
                term: { userId: params.userId },
            });
        }

        const response: any = await (esClient as any).search({
            index: EMAIL_INDEX,
            from,
            size: limit,
            query: {
                bool: {
                    must: mustClauses,
                    filter: filterClauses,
                },
            },
            sort: [
                { scheduledAt: { order: 'desc' } },
                '_score',
            ],
        });

        const hits = response.hits?.hits || [];
        const total = typeof response.hits?.total === 'number'
            ? response.hits.total
            : (response.hits?.total?.value || 0);

        const data = hits.map((hit: any) => {
            const src = hit._source;
            return {
                id: src.id,
                campaignId: src.campaignId,
                senderEmail: src.senderEmail,
                senderName: src.senderName,
                recipient: src.recipient,
                recipientName: src.recipientName,
                subject: src.subject,
                bodyPreview: src.body ? src.body.substring(0, 120) : '',
                scheduledAt: src.scheduledAt,
                sentAt: src.sentAt,
                status: (src.status || '').toLowerCase(),
                previewUrl: src.previewUrl,
                score: hit._score,
            };
        });

        return {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            data,
        };
    } catch (err: any) {
        console.warn('[Elasticsearch] Search query failed, falling back to DB:', err.message);
        return null;
    }
}

export async function syncAllDbEmailsToElasticsearch(): Promise<{ synced: number; error?: string }> {
    if (!esClient || !isElasticsearchAvailable) {
        return { synced: 0, error: 'Elasticsearch is not connected' };
    }

    try {
        await ensureEmailIndex();

        const allJobs = await prisma.emailJob.findMany({
            include: {
                sender: { select: { email: true, displayName: true } },
                campaign: { select: { userId: true } },
            },
            take: 2000,
        });

        if (allJobs.length === 0) {
            return { synced: 0 };
        }

        const operations = allJobs.flatMap((job) => [
            { index: { _index: EMAIL_INDEX, _id: job.id } },
            {
                id: job.id,
                campaignId: job.campaignId,
                userId: job.campaign?.userId,
                senderId: job.senderId,
                senderEmail: job.sender?.email,
                senderName: job.sender?.displayName,
                recipient: job.recipient,
                recipientName: job.recipientName,
                subject: job.subject,
                body: job.body ? job.body.replace(/<[^>]*>?/gm, ' ').substring(0, 5000) : '',
                status: job.status.toUpperCase(),
                scheduledAt: job.scheduledAt.toISOString(),
                sentAt: job.sentAt ? job.sentAt.toISOString() : null,
                createdAt: job.createdAt.toISOString(),
                previewUrl: job.previewUrl,
            },
        ]);

        const bulkResponse = await (esClient as any).bulk({ refresh: true, operations });
        let syncedCount = allJobs.length;
        if (bulkResponse.errors) {
            syncedCount = bulkResponse.items.filter((item: any) => !item.index?.error).length;
        }

        console.log(`[Elasticsearch] Synced ${syncedCount} emails from PostgreSQL to Elasticsearch.`);
        return { synced: syncedCount };
    } catch (err: any) {
        console.error('[Elasticsearch] Sync error:', err.message);
        return { synced: 0, error: err.message };
    }
}

