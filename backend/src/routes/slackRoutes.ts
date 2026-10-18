import { Router } from 'express';
import {
    getSlackStatus,
    getSlackAuthUrlHandler,
    handleSlackOAuthCallback,
    saveSlackWebhook,
    disconnectSlack,
    testSlack,
} from '../controllers/slackController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// OAuth callback is public because Slack redirects the user's browser here
router.get('/callback', handleSlackOAuthCallback);

// Authenticated or session endpoints
router.get('/status', requireAuth, getSlackStatus);
router.get('/auth-url', requireAuth, getSlackAuthUrlHandler);
router.post('/webhook', requireAuth, saveSlackWebhook);
router.post('/disconnect', requireAuth, disconnectSlack);
router.post('/test', requireAuth, testSlack);

export default router;

