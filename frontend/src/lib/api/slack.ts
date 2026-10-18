import { apiClient } from './client';

export interface SlackStatus {
    connected: boolean;
    channel?: string | null;
    teamName?: string | null;
    connectedAt?: string | null;
    isWebhook?: boolean;
}

export async function fetchSlackStatus(): Promise<SlackStatus> {
    try {
        const response = await apiClient.get<SlackStatus>('/slack/status');
        return response.data;
    } catch {
        return { connected: false };
    }
}

export async function getSlackAuthUrl(): Promise<string | null> {
    try {
        const response = await apiClient.get<{ authUrl: string }>('/slack/auth-url');
        return response.data.authUrl;
    } catch {
        return null;
    }
}

export async function saveSlackWebhook(webhookUrl: string, channel?: string): Promise<{ success: boolean; message: string }> {
    try {
        const response = await apiClient.post('/slack/webhook', { webhookUrl, channel });
        return { success: true, message: response.data.message || 'Slack webhook saved' };
    } catch (err: any) {
        return {
            success: false,
            message: err.response?.data?.error || err.message || 'Failed to connect Slack webhook',
        };
    }
}

export async function disconnectSlack(): Promise<{ success: boolean; message: string }> {
    try {
        const response = await apiClient.post('/slack/disconnect');
        return { success: true, message: response.data.message || 'Slack disconnected' };
    } catch (err: any) {
        return {
            success: false,
            message: err.response?.data?.error || err.message || 'Failed to disconnect Slack',
        };
    }
}

export async function sendSlackTest(): Promise<{ success: boolean; message: string }> {
    try {
        const response = await apiClient.post('/slack/test');
        return { success: true, message: response.data.message || 'Slack test notification sent!' };
    } catch (err: any) {
        return {
            success: false,
            message: err.response?.data?.error || err.message || 'Failed to send test alert',
        };
    }
}

