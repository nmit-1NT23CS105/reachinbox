import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import {
    searchElasticsearchEmails,
    syncAllDbEmailsToElasticsearch,
    isElasticsearchAvailable,
    EMAIL_INDEX,
} from '../services/elasticsearchService';

const router = Router();

// GET /api/emails/elasticsearch/status
router.get('/status', (req, res) => {
    res.json({
        available: isElasticsearchAvailable,
        index: EMAIL_INDEX,
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });
});

// GET /api/emails/elasticsearch/search
router.get('/search', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const query = (req.query.q as string) || (req.query.search as string) || '';
        const status = req.query.status as string;
        const page = parseInt((req.query.page as string) || '1', 10);
        const limit = parseInt((req.query.limit as string) || '20', 10);

        const result = await searchElasticsearchEmails({
            query,
            status,
            page,
            limit,
        });

        if (!result) {
            return res.status(503).json({
                error: 'Elasticsearch is currently unavailable. Using database fallback.',
                data: [],
                pagination: { page: 1, limit, total: 0, totalPages: 1 },
            });
        }

        return res.json({
            data: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
            source: 'elasticsearch',
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Elasticsearch search failed' });
    }
});

// POST /api/emails/elasticsearch/sync
router.post('/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await syncAllDbEmailsToElasticsearch();
        return res.json({
            message: `Successfully synchronized ${result.synced} emails to Elasticsearch index "${EMAIL_INDEX}".`,
            ...result,
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to synchronize with Elasticsearch' });
    }
});

export default router;

