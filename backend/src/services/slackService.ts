import axios from 'axios';
import { prisma } from '../db/prisma';
import Redis from 'ioredis';
import { getHourWindowKey } from './rateLimiter';

export interface SlackRateLimitAlertParams {
    senderId: string;
    senderEmail: string;
    userId: string;
    hourlyLimit: number;
    nextWindow: Date;
    redisConnection?: Redis | null;
}

export function getSlackAuthUrl(): string {
    const clientId = process.env.SLACK_CLIENT_ID || '';
    const redirectUri = process.env.SLACK_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/slack/callback`;
    const scopes = 'incoming-webhook,chat:write';
    return `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export async function exchangeSlackOAuthCode(code: string) {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.SLACK_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/slack/callback`;

    if (!clientId || !clientSecret) {
        throw new Error('SLACK_CLIENT_ID and SLACK_CLIENT_SECRET must be configured.');
    }

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const response = await axios.post('https://slack.com/api/oauth.v2.access', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.data.ok) {
        throw new Error(response.data.error || 'Slack OAuth authorization exchange failed');
    }

    return {
        accessToken: response.data.access_token,
        webhookUrl: response.data.incoming_webhook?.url,
        channel: response.data.incoming_webhook?.channel || response.data.incoming_webhook?.configuration_url,
        teamName: response.data.team?.name,
    };
}

export async function sendRateLimitSlackNotification(params: SlackRateLimitAlertParams): Promise<boolean> {
    try {
        // Fetch user Slack credentials
        let user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { id: true, slackWebhookUrl: true, slackAccessToken: true, slackChannel: true },
        });

        // Fallback: If campaign user doesn't have Slack connected, check if any system user has Slack connected
        if (!user?.slackWebhookUrl && !user?.slackAccessToken) {
            user = await prisma.user.findFirst({
                where: { OR: [{ slackWebhookUrl: { not: null } }, { slackAccessToken: { not: null } }] },
                select: { id: true, slackWebhookUrl: true, slackAccessToken: true, slackChannel: true },
            });
        }

        if (!user || (!user.slackWebhookUrl && !user.slackAccessToken)) {
            // Not connected: strictly non-fatal per assignment specs ("rate-limit hits should simply not notify (no crash)")
            return false;
        }

        // Deduplication in Redis to prevent spamming Slack for every single email in the same window
        if (params.redisConnection) {
            const hourKey = getHourWindowKey();
            const dedupeKey = `slack-alerted:${params.senderId}:${hourKey}`;
            const alreadySent = await params.redisConnection.get(dedupeKey).catch(() => null);
            if (alreadySent) {
                return true;
            }
            await params.redisConnection.set(dedupeKey, '1', 'EX', 3600).catch(() => {});
        }

        const messagePayload = {
            text: `⚠️ Rate Limit Alert: Sender ${params.senderEmail} reached ${params.hourlyLimit} emails/hour`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '⚠️ ReachInbox Rate Limit Reached',
                        emoji: true,
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*A sender has reached their hourly sending quota.* Outbox queue jobs are automatically being postponed to the next window.`,
                    },
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Sender Email:*\n\`${params.senderEmail}\`` },
                        { type: 'mrkdwn', text: `*Hourly Limit:*\n\`${params.hourlyLimit} emails/hr\`` },
                        { type: 'mrkdwn', text: `*Next Window:*\n\`${params.nextWindow.toISOString()}\`` },
                        { type: 'mrkdwn', text: `*Scheduler Action:*\n\`Auto-Rescheduled (Order Preserved)\`` },
                    ],
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `*ReachInbox Engine* • Triggered at ${new Date().toLocaleTimeString('en-US', { hour12: true })} UTC`,
                        },
                    ],
                },
            ],
        };

        if (user.slackWebhookUrl) {
            await axios.post(user.slackWebhookUrl, messagePayload);
            console.log(`[SlackService] Rate limit notification dispatched to webhook for sender ${params.senderEmail}`);
            return true;
        } else if (user.slackAccessToken) {
            await axios.post(
                'https://slack.com/api/chat.postMessage',
                {
                    channel: user.slackChannel || '#general',
                    ...messagePayload,
                },
                {
                    headers: { Authorization: `Bearer ${user.slackAccessToken}` },
                }
            );
            console.log(`[SlackService] Rate limit notification dispatched via Bot Token to ${user.slackChannel}`);
            return true;
        }

        return false;
    } catch (err: any) {
        console.error('[SlackService] Error sending Slack notification:', err.response?.data || err.message);
        return false;
    }
}

export async function sendSlackTestMessage(userId: string): Promise<{ success: boolean; message: string }> {
    try {
        let user = await prisma.user.findUnique({
            where: { id: userId },
            select: { slackWebhookUrl: true, slackAccessToken: true, slackChannel: true },
        });

        if (!user?.slackWebhookUrl && !user?.slackAccessToken) {
            user = await prisma.user.findFirst({
                where: { OR: [{ slackWebhookUrl: { not: null } }, { slackAccessToken: { not: null } }] },
                select: { slackWebhookUrl: true, slackAccessToken: true, slackChannel: true },
            });
        }

        if (!user || (!user.slackWebhookUrl && !user.slackAccessToken)) {
            return { success: false, message: 'No Slack integration found. Please connect Slack first.' };
        }

        const payload = {
            text: '🎉 ReachInbox Slack Integration Connected Successfully!',
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '🚀 ReachInbox Slack Integration Live',
                        emoji: true,
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Success!* Your Slack integration is active. You will receive live alerts whenever an email sender hits their hourly quota.`,
                    },
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `Connected on ${new Date().toLocaleString()}`,
                        },
                    ],
                },
            ],
        };

        if (user.slackWebhookUrl) {
            await axios.post(user.slackWebhookUrl, payload);
            return { success: true, message: 'Test message delivered via Slack Webhook!' };
        } else if (user.slackAccessToken) {
            const res = await axios.post(
                'https://slack.com/api/chat.postMessage',
                {
                    channel: user.slackChannel || '#general',
                    ...payload,
                },
                {
                    headers: { Authorization: `Bearer ${user.slackAccessToken}` },
                }
            );
            if (!res.data.ok) throw new Error(res.data.error || 'Failed to post message to Slack channel');
            return { success: true, message: `Test message delivered to channel ${user.slackChannel}!` };
        }

        return { success: false, message: 'Slack integration is not configured.' };
    } catch (err: any) {
        return { success: false, message: err.response?.data?.message || err.message };
    }
}

