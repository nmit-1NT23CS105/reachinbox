import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { prisma } from '../db/prisma';
import { getSlackAuthUrl, exchangeSlackOAuthCode, sendSlackTestMessage } from '../services/slackService';

export async function getSlackStatus(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
        if (!user || (!user.slackWebhookUrl && !user.slackAccessToken)) {
            const configuredUser = await prisma.user.findFirst({
                where: { OR: [{ slackWebhookUrl: { not: null } }, { slackAccessToken: { not: null } }] },
            });
            if (configuredUser) user = configuredUser;
        }

        const isConnected = Boolean(user?.slackWebhookUrl || user?.slackAccessToken);

        return res.json({
            connected: isConnected,
            channel: user?.slackChannel || (user?.slackWebhookUrl ? 'Webhook Channel' : null),
            teamName: user?.slackTeamName || null,
            connectedAt: user?.slackConnectedAt || null,
            isWebhook: Boolean(user?.slackWebhookUrl),
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Failed to retrieve Slack connection status' });
    }
}

export async function getSlackAuthUrlHandler(req: AuthenticatedRequest, res: Response) {
    try {
        const authUrl = getSlackAuthUrl();
        return res.json({ authUrl });
    } catch (err: any) {
        return res.status(500).json({ error: 'Failed to generate Slack OAuth URL' });
    }
}

export async function handleSlackOAuthCallback(req: any, res: Response) {
    try {
        const code = req.query.code as string;
        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/scheduled?slack=error&reason=missing_code`);
        }

        const oauthResult = await exchangeSlackOAuthCode(code);

        // Find user to associate
        let user = await prisma.user.findFirst();
        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    slackAccessToken: oauthResult.accessToken,
                    slackWebhookUrl: oauthResult.webhookUrl,
                    slackChannel: oauthResult.channel,
                    slackTeamName: oauthResult.teamName,
                    slackConnectedAt: new Date(),
                },
            });
        }

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/scheduled?slack=connected`);
    } catch (err: any) {
        console.error('[SlackOAuthCallback] Error during OAuth exchange:', err.message);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/scheduled?slack=error&message=${encodeURIComponent(err.message)}`);
    }
}

export async function saveSlackWebhook(req: AuthenticatedRequest, res: Response) {
    try {
        const { webhookUrl, channel } = req.body;
        if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://hooks.slack.com/')) {
            return res.status(400).json({ error: 'Valid Slack incoming webhook URL starting with https://hooks.slack.com/ is required.' });
        }

        const userId = req.user?.id;
        let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
        if (!user) user = await prisma.user.findFirst();

        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    slackWebhookUrl: webhookUrl.trim(),
                    slackChannel: channel ? channel.trim() : '#general',
                    slackConnectedAt: new Date(),
                },
            });
        }

        return res.json({
            message: 'Slack Incoming Webhook connected successfully',
            connected: true,
            channel: channel || '#general',
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Failed to save Slack webhook URL' });
    }
}

export async function disconnectSlack(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id;
        let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
        if (!user) user = await prisma.user.findFirst();

        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    slackWebhookUrl: null,
                    slackAccessToken: null,
                    slackChannel: null,
                    slackTeamName: null,
                    slackConnectedAt: null,
                },
            });
        }

        return res.json({ message: 'Slack disconnected successfully', connected: false });
    } catch (err: any) {
        return res.status(500).json({ error: 'Failed to disconnect Slack' });
    }
}

export async function testSlack(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user?.id || '';
        const result = await sendSlackTestMessage(userId);
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }
        return res.json({ message: result.message });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to trigger Slack test notification' });
    }
}
