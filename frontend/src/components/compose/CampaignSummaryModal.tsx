'use client';

import React from 'react';
import { AlertCircle, Mail } from 'lucide-react';

interface CampaignSummaryModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    recipientCount?: number;
    senderEmail?: string;
    totalRecipients?: number;
    subject: string;
    scheduledAt?: string;
    delayBetweenSeconds: number;
    hourlyLimit: number;
    onConfirm: () => void;
    onCancel?: () => void;
    isSubmitting?: boolean;
}

export default function CampaignSummaryModal({
    isOpen = true,
    onClose,
    recipientCount,
    senderEmail,
    totalRecipients = 0,
    subject,
    scheduledAt,
    delayBetweenSeconds,
    hourlyLimit,
    onConfirm,
    onCancel,
    isSubmitting,
}: CampaignSummaryModalProps) {
    if (!isOpen) return null;

    const count = recipientCount || totalRecipients;
    const isImmediate = !scheduledAt;

    const batchIntervalSeconds = 3600 / hourlyLimit;
    const effectiveDelaySeconds = Math.max(delayBetweenSeconds, batchIntervalSeconds);
    const totalSeconds = count * effectiveDelaySeconds;
    const estimatedHours = (totalSeconds / 3600).toFixed(1);

    const handleDismiss = () => {
        if (onClose) onClose();
        if (onCancel) onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-gray-900 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-[#e6f4ea] text-[#00a854] flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#00a854]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Confirm Email Campaign</h3>
                        <p className="text-xs text-gray-500">ReachInbox Rate Limit Safeguards</p>
                    </div>
                </div>

                <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5 text-xs text-gray-700">
                    <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Total Leads</span>
                        <span className="font-bold text-gray-900">{count.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Subject</span>
                        <span className="font-bold text-gray-900 truncate max-w-[200px]">{subject}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Mode</span>
                        <span className="font-bold text-[#00a854]">
                            {isImmediate ? 'Immediate Dispatch' : 'Scheduled Queue'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Throttling</span>
                        <span className="font-mono text-gray-900">
                            {hourlyLimit}/hr • {delayBetweenSeconds}s delay
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                        <span className="text-gray-500">Est. Duration</span>
                        <span className="font-bold text-gray-900">{estimatedHours} Hours</span>
                    </div>
                </div>

                {count > 50 && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs mb-5 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p>
                            You are queueing over 50 emails. BullMQ worker will throttle dispatches according to your hourly rate limit.
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-end space-x-3">
                    <button
                        type="button"
                        onClick={handleDismiss}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-lg bg-[#00a854] hover:bg-[#00875a] text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? 'Queueing...' : 'Confirm & Schedule'}
                    </button>
                </div>
            </div>
        </div>
    );
}
