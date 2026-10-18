'use client';

import React, { useState, useEffect } from 'react';
import {
    fetchSlackStatus,
    getSlackAuthUrl,
    saveSlackWebhook,
    disconnectSlack,
    sendSlackTest,
    SlackStatus,
} from '@/lib/api/slack';
import { X, CheckCircle2, AlertCircle, Send, Link as LinkIcon, Unlink, ExternalLink, RefreshCw } from 'lucide-react';

interface SlackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: (status: SlackStatus) => void;
}

export default function SlackModal({ isOpen, onClose, onStatusChange }: SlackModalProps) {
    const [status, setStatus] = useState<SlackStatus>({ connected: false });
    const [loading, setLoading] = useState<boolean>(true);
    const [webhookUrl, setWebhookUrl] = useState<string>('');
    const [channelName, setChannelName] = useState<string>('#general');
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadStatus = async () => {
        setLoading(true);
        const st = await fetchSlackStatus();
        setStatus(st);
        if (st.channel) setChannelName(st.channel);
        onStatusChange?.(st);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadStatus();
            setMsg(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConnectOAuth = async () => {
        try {
            setActionLoading(true);
            const authUrl = await getSlackAuthUrl();
            if (authUrl) {
                window.location.href = authUrl;
            } else {
                setMsg({ type: 'error', text: 'SLACK_CLIENT_ID is not configured in backend environment.' });
            }
        } catch {
            setMsg({ type: 'error', text: 'Failed to initiate Slack OAuth flow. You can use the Webhook option below.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveWebhook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!webhookUrl.trim() || !webhookUrl.startsWith('https://hooks.slack.com/')) {
            setMsg({ type: 'error', text: 'Please enter a valid Slack Webhook URL starting with https://hooks.slack.com/' });
            return;
        }

        try {
            setActionLoading(true);
            const res = await saveSlackWebhook(webhookUrl.trim(), channelName.trim());
            if (res.success) {
                setMsg({ type: 'success', text: 'Slack Webhook connected successfully!' });
                setWebhookUrl('');
                loadStatus();
            } else {
                setMsg({ type: 'error', text: res.message });
            }
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message || 'Failed to save webhook.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setActionLoading(true);
            const res = await disconnectSlack();
            if (res.success) {
                setMsg({ type: 'success', text: 'Slack disconnected.' });
                loadStatus();
            } else {
                setMsg({ type: 'error', text: res.message });
            }
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message || 'Failed to disconnect.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendTest = async () => {
        try {
            setActionLoading(true);
            setMsg(null);
            const res = await sendSlackTest();
            if (res.success) {
                setMsg({ type: 'success', text: 'Live alert delivered to your Slack channel!' });
            } else {
                setMsg({ type: 'error', text: res.message });
            }
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message || 'Failed to send test alert.' });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 text-gray-900 animate-in fade-in zoom-in-95 duration-100">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#e6f4ea] text-[#00a854] flex items-center justify-center">
                            <span className="font-bold text-sm">#</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Slack Rate Limit Alerts</h3>
                            <p className="text-xs text-gray-500">Live Slack notifications when email rate limit is hit</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Status Banner */}
                <div className="mt-4">
                    {loading ? (
                        <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-center space-x-2 text-xs text-gray-500">
                            <RefreshCw className="w-4 h-4 animate-spin text-[#00a854]" />
                            <span>Checking connection...</span>
                        </div>
                    ) : status.connected ? (
                        <div className="p-3.5 bg-[#e6f4ea] border border-[#a8dab5] rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2.5">
                                <CheckCircle2 className="w-4 h-4 text-[#00a854] flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-gray-900">
                                        Connected: {status.teamName || status.channel || 'Webhook Active'}
                                    </p>
                                    <p className="text-[11px] text-[#00a854]">
                                        Alerts enabled • Will notify immediately when hourly limit triggers
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleSendTest}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 rounded-md bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs border border-gray-200 transition-all flex items-center space-x-1"
                                >
                                    <Send className="w-3 h-3" />
                                    <span>Test</span>
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs border border-red-200 transition-all flex items-center space-x-1"
                                >
                                    <Unlink className="w-3 h-3" />
                                    <span>Disconnect</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center space-x-2.5 text-xs text-gray-600">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <span>Slack is currently disconnected. Rate limit hits will be queued without notifying.</span>
                        </div>
                    )}
                </div>

                {/* Message Banner */}
                {msg && (
                    <div
                        className={`mt-3 p-3 rounded-lg text-xs font-medium border ${
                            msg.type === 'success'
                                ? 'bg-[#e6f4ea] text-[#00a854] border-[#a8dab5]'
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                    >
                        {msg.text}
                    </div>
                )}

                {/* Connection Options */}
                {!status.connected && (
                    <div className="mt-4 space-y-3.5">
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-gray-900">Option 1: Slack OAuth Flow</span>
                                <span className="text-[10px] text-gray-400 uppercase font-semibold">Recommended</span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                Authorize your Slack workspace via OAuth. Required scopes: <code>incoming-webhook</code>, <code>chat:write</code>.
                            </p>
                            <button
                                onClick={handleConnectOAuth}
                                disabled={actionLoading}
                                className="w-full mt-2 py-2 px-3 rounded-lg bg-[#00a854] hover:bg-[#00875a] text-white font-semibold text-xs transition-all flex items-center justify-center space-x-2 shadow-xs"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Connect with Slack OAuth</span>
                            </button>
                        </div>

                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-gray-900">Option 2: Direct Incoming Webhook</span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                Paste an Incoming Webhook URL from your Slack App configuration.
                            </p>

                            <form onSubmit={handleSaveWebhook} className="space-y-2">
                                <input
                                    type="url"
                                    placeholder="https://hooks.slack.com/services/T.../B.../..."
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:border-[#00a854]"
                                />
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="#general (channel name)"
                                        value={channelName}
                                        onChange={(e) => setChannelName(e.target.value)}
                                        className="w-1/3 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#00a854]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={actionLoading || !webhookUrl}
                                        className="flex-1 py-1.5 px-3 rounded-lg bg-[#00a854] hover:bg-[#00875a] text-white font-semibold text-xs disabled:opacity-50 transition-colors"
                                    >
                                        Save & Connect
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
