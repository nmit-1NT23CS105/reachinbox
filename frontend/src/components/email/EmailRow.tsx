'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EmailListItem } from '@/types';
import { Clock, Star, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface EmailRowProps {
    email: EmailListItem;
}

export default function EmailRow({ email }: EmailRowProps) {
    const [starred, setStarred] = useState(false);

    const isScheduled = email.status === 'scheduled';
    const isProcessing = email.status === 'processing';
    const isSent = email.status === 'sent';
    const isFailed = email.status === 'failed';

    const targetDate = new Date(email.sentAt || email.scheduledAt);

    // Format like Figma: "Tue 07:57 AM - Scheduled"
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedTime = targetDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    return (
        <div className="group flex items-center justify-between px-3 md:px-5 py-3 border-b border-gray-100 hover:bg-gray-50/70 transition-colors cursor-pointer text-xs">
            <Link
                href={`/dashboard/email/${email.id}`}
                className="flex items-center space-x-3.5 min-w-0 flex-1 pr-3"
            >
                {/* Recipient Column matching Figma */}
                <div className="w-36 sm:w-44 flex-shrink-0">
                    <p className="font-bold text-gray-900 truncate">
                        To: {email.recipientName || email.recipient}
                    </p>
                </div>

                {/* Status Badge matching Figma exact colors & icons */}
                <div className="flex-shrink-0">
                    {isScheduled && (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#fff3e0] text-[#d97706] border border-[#ffe0b2]">
                            <Clock className="w-3 h-3 text-[#d97706]" />
                            <span>{dayName} {formattedTime} - Scheduled</span>
                        </span>
                    )}
                    {isProcessing && (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#e8f0fe] text-[#1a73e8]">
                            <RefreshCw className="w-3 h-3 text-[#1a73e8] animate-spin" />
                            <span>Sending...</span>
                        </span>
                    )}
                    {isSent && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#f1f3f4] text-[#5f6368]">
                            <span>Sent</span>
                        </span>
                    )}
                    {isFailed && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#fce8e6] text-[#c5221f]">
                            <AlertCircle className="w-3 h-3" />
                            <span>Failed</span>
                        </span>
                    )}
                </div>

                {/* Subject & Preview matching Figma */}
                <div className="min-w-0 flex-1 pl-2">
                    <span className="font-bold text-gray-900 mr-1.5">
                        {email.subject}
                    </span>
                    <span className="text-gray-500 truncate hidden md:inline text-xs">
                        - {email.bodyPreview}
                    </span>
                </div>
            </Link>

            {/* Right side: Ethereal preview link & Star icon */}
            <div className="flex items-center space-x-2.5 flex-shrink-0 pl-2">
                {email.previewUrl && (
                    <a
                        href={email.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#e6f4ea] hover:bg-[#d8eedd] text-[#00a854] border border-[#a8dab5] rounded-full text-[11px] font-semibold transition-colors"
                        title="View rendered email preview on Ethereal Email SMTP"
                    >
                        <span>Preview Email</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setStarred(!starred);
                    }}
                    className="p-1 text-gray-300 hover:text-amber-400 transition-colors"
                >
                    <Star
                        className={`w-4 h-4 ${
                            starred ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                        }`}
                    />
                </button>
            </div>
        </div>
    );
}
