'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmailDetailData } from '@/types';
import {
    ArrowLeft,
    Star,
    Trash2,
    Clock,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Play,
    Copy,
    Check,
    Archive,
    Loader2,
} from 'lucide-react';
import { deleteEmailApi, triggerSendEmailApi } from '@/lib/api/emails';

interface EmailDetailProps {
    email: EmailDetailData;
}

export default function EmailDetail({ email }: EmailDetailProps) {
    const router = useRouter();
    const [isStarred, setIsStarred] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const isScheduled = email.status === 'scheduled';
    const isSent = email.status === 'sent';
    const isFailed = email.status === 'failed';

    const formattedDate = new Date(email.sentAt || email.scheduledAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const delaySeconds = email.delayMs
        ? Math.round(email.delayMs / 1000)
        : email.delayBetweenSeconds || 2;

    const handleTriggerSend = async () => {
        setIsSending(true);
        setActionMessage(null);
        try {
            await triggerSendEmailApi(email.id);
            setActionMessage({ type: 'success', text: 'Email dispatched immediately via Ethereal SMTP!' });
            setTimeout(() => {
                router.refresh();
            }, 1200);
        } catch (err: any) {
            setActionMessage({
                type: 'error',
                text: err.response?.data?.error || 'Failed to dispatch email.',
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this email job? This cannot be undone.')) {
            return;
        }
        setIsDeleting(true);
        setActionMessage(null);
        try {
            await deleteEmailApi(email.id);
            setActionMessage({ type: 'success', text: 'Email deleted successfully.' });
            setTimeout(() => {
                router.push(isScheduled ? '/dashboard/scheduled' : '/dashboard/sent');
            }, 800);
        } catch (err: any) {
            setActionMessage({
                type: 'error',
                text: err.response?.data?.error || 'Failed to delete email.',
            });
            setIsDeleting(false);
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(label);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const senderInitial = (email.senderName || email.senderEmail || 'A')[0].toUpperCase();

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-5xl mx-auto overflow-hidden font-sans text-gray-900">
            {/* Top Bar matching Figma */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1 pr-4">
                    <Link
                        href={isScheduled ? '/dashboard/scheduled' : '/dashboard/sent'}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="text-sm font-bold text-gray-900 truncate">
                        {email.subject}
                    </h1>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Start / Send Now Button for Scheduled */}
                    {isScheduled && (
                        <button
                            onClick={handleTriggerSend}
                            disabled={isSending || isDeleting}
                            className="px-3 py-1 rounded-full border-2 border-[#00a854] text-[#00a854] hover:bg-[#e6f4ea] font-semibold text-xs flex items-center space-x-1 transition-colors disabled:opacity-50"
                            title="Send Immediately"
                        >
                            {isSending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            <span>Send Now</span>
                        </button>
                    )}

                    {/* Star Favorite */}
                    <button
                        onClick={() => setIsStarred(!isStarred)}
                        className={`p-1.5 rounded-lg transition-colors ${
                            isStarred ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'
                        }`}
                        title="Star"
                    >
                        <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Archive */}
                    <button
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                        title="Archive"
                    >
                        <Archive className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete Email"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Action Toast */}
            {actionMessage && (
                <div
                    className={`px-5 py-2.5 border-b text-xs font-medium flex items-center space-x-2 ${
                        actionMessage.type === 'success'
                            ? 'bg-[#e6f4ea] text-[#00a854] border-[#a8dab5]'
                            : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                >
                    {actionMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : (
                        <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{actionMessage.text}</span>
                </div>
            )}

            {/* Sender and Recipient Header matching Figma */}
            <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-5 pb-5 border-b border-gray-100">
                    <div className="flex items-start space-x-3.5">
                        <div className="w-9 h-9 rounded-full bg-[#00a854] text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-xs">
                            {senderInitial}
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="font-bold text-gray-900 text-sm">
                                    {email.senderName || 'Sender'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    &lt;{email.senderEmail}&gt;
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                to <span className="font-semibold text-gray-700">{email.recipientName || email.recipient}</span> ▾
                            </p>
                        </div>
                    </div>

                    <div className="text-right flex items-center space-x-2">
                        <span className="text-xs text-gray-400 font-medium">{formattedDate}</span>
                        {email.previewUrl && (
                            <a
                                href={email.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#e6f4ea] text-[#00a854] border border-[#a8dab5] rounded-full text-xs font-semibold hover:bg-[#d8edd9] transition-colors"
                            >
                                <span>Preview Email</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Email Body Content matching Figma */}
                <div className="prose max-w-none text-gray-800 text-xs leading-relaxed mb-6 p-4 bg-white rounded-xl">
                    <div dangerouslySetInnerHTML={{ __html: email.body }} />
                </div>

                {/* Delivery Parameters / Technical Metadata */}
                <div className="bg-[#f8f9fa] rounded-xl p-4 border border-gray-100 text-xs text-gray-500 space-y-2">
                    <div className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                        Delivery Parameters & Queue Tracking
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                        <div>
                            <span className="block text-gray-400 text-[11px]">Campaign</span>
                            <span className="font-semibold text-gray-800">{email.campaignName}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-[11px]">Inter-Email Delay</span>
                            <span className="font-semibold text-gray-800">{delaySeconds} seconds</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-[11px]">Hourly Limit</span>
                            <span className="font-semibold text-gray-800">{email.hourlyLimit} / hr</span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-[11px]">Status</span>
                            <span className="font-semibold text-gray-800 capitalize">{email.status}</span>
                        </div>
                    </div>
                    {email.messageId && (
                        <div className="pt-2 border-t border-gray-200/60 font-mono text-[11px] text-gray-400 truncate flex items-center justify-between">
                            <span>Message-ID: {email.messageId}</span>
                            <button
                                onClick={() => handleCopy(email.messageId || '', 'ID')}
                                className="text-gray-500 hover:text-gray-900 ml-2"
                            >
                                {copiedText === 'ID' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
