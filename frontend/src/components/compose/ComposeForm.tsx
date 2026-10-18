'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RecipientInput from './RecipientInput';
import CsvUploader from './CsvUploader';
import RichTextEditor from './RichTextEditor';
import SchedulePanel from './SchedulePanel';
import CampaignSummaryModal from './CampaignSummaryModal';
import { scheduleCampaignApi, sendImmediateApi } from '@/lib/api/emails';
import { getCurrentUser } from '@/lib/api/auth';
import { User } from '@/types';
import { ArrowLeft, Paperclip, Clock, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ScheduleOptions {
    scheduledAt: string;
    delayBetweenSeconds: number;
    hourlyLimit: number;
}

const getRequestErrorMessage = (err: any, fallback: string) =>
    err.response?.data?.error || err.response?.data?.message || err.message || fallback;

export default function ComposeForm() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [recipients, setRecipients] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [scheduledAt, setScheduledAt] = useState<string>('');
    const [delayBetweenSeconds, setDelayBetweenSeconds] = useState<number>(2);
    const [hourlyLimit, setHourlyLimit] = useState<number>(200);

    const [showSchedulePanel, setShowSchedulePanel] = useState<boolean>(false);
    const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
    const [pendingSchedule, setPendingSchedule] = useState<ScheduleOptions | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('reachinbox_user');
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) {}
            }
        }
        getCurrentUser().then((u) => {
            if (u) setUser(u);
        });
    }, []);

    const displayEmail = user?.senders?.[0]?.email || user?.email || 'oliver.brown@domain.io';

    const handlePrimaryAction = () => {
        if (recipients.length === 0) {
            setErrorMsg('Please enter at least one recipient email or upload a lead list.');
            return;
        }
        if (!subject.trim()) {
            setErrorMsg('Please specify a subject for the email.');
            return;
        }
        if (!bodyHtml.trim()) {
            setErrorMsg('Email body cannot be empty.');
            return;
        }

        if (scheduledAt) {
            executeSchedule();
        } else {
            if (recipients.length > 50) {
                setShowSummaryModal(true);
            } else {
                executeImmediateSend();
            }
        }
    };

    const executeImmediateSend = async () => {
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const res = await sendImmediateApi({
                recipients,
                recipient: recipients[0],
                subject,
                body: bodyHtml,
            });

            setSuccessMsg(`Email dispatched successfully to ${res.totalRecipients} recipients! Redirecting...`);
            setTimeout(() => router.push('/dashboard/sent'), 1200);
        } catch (err: any) {
            setErrorMsg(getRequestErrorMessage(err, 'Failed to dispatch email.'));
        } finally {
            setIsSubmitting(false);
            setShowSummaryModal(false);
        }
    };

    const executeSchedule = async (scheduleOptions?: ScheduleOptions | null) => {
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const selectedSchedule = scheduleOptions || pendingSchedule;
            const selectedTime = selectedSchedule?.scheduledAt || scheduledAt;
            const selectedDelay = selectedSchedule?.delayBetweenSeconds || delayBetweenSeconds;
            const selectedHourlyLimit = selectedSchedule?.hourlyLimit || hourlyLimit;
            const targetTime = selectedTime || new Date(Date.now() + 2 * 60 * 1000).toISOString();

            const res = await scheduleCampaignApi({
                recipients,
                subject,
                body: bodyHtml,
                scheduledAt: targetTime,
                delayMs: selectedDelay * 1000,
                delayBetweenSeconds: selectedDelay,
                hourlyLimit: selectedHourlyLimit,
            });

            setSuccessMsg(`Campaign scheduled for ${res.totalRecipients} recipients! Redirecting...`);
            setTimeout(() => router.push('/dashboard/scheduled'), 1200);
        } catch (err: any) {
            setErrorMsg(getRequestErrorMessage(err, 'Failed to schedule campaign.'));
        } finally {
            setIsSubmitting(false);
            setShowSchedulePanel(false);
            setShowSummaryModal(false);
            setPendingSchedule(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 font-sans text-gray-900">
            {/* Top Bar matching Figma */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <Link
                        href="/dashboard/scheduled"
                        className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        title="Back to Scheduled"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="text-sm font-bold text-gray-900 tracking-tight">
                        Compose New Email
                    </h1>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Attach Files"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowSchedulePanel(!showSchedulePanel)}
                        className={`p-1 rounded transition-colors ${
                            scheduledAt ? 'text-[#00a854]' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title="Schedule Send Time"
                    >
                        <Clock className="w-4 h-4" />
                    </button>

                    {/* Action Button: Send or Send Later */}
                    <button
                        type="button"
                        onClick={handlePrimaryAction}
                        disabled={isSubmitting}
                        className="py-1.5 px-5 rounded-full border-2 border-[#00a854] text-[#00a854] hover:bg-[#e6f4ea] font-semibold text-xs transition-colors disabled:opacity-50 active:scale-95 shadow-2xs"
                    >
                        {isSubmitting
                            ? 'Processing...'
                            : scheduledAt
                            ? 'Send Later'
                            : 'Send'}
                    </button>
                </div>
            </div>

            {/* Notification Alerts */}
            {errorMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}
            {successMsg && (
                <div className="mt-4 p-3 bg-[#e6f4ea] border border-[#a8dab5] text-[#00a854] text-xs rounded-xl flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00a854] flex-shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Form Fields matching Figma */}
            <div className="space-y-3.5 pt-4">
                {/* From Row */}
                <div className="flex items-center space-x-4 text-xs pb-2 border-b border-gray-100">
                    <span className="w-12 font-medium text-gray-500">From</span>
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#f1f3f4] rounded-lg text-xs font-medium text-gray-800">
                        <span>{displayEmail}</span>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                    </div>
                </div>

                {/* To Row with Upload List button matching Figma */}
                <div className="flex items-center space-x-4 text-xs pb-2 border-b border-gray-100">
                    <span className="w-12 font-medium text-gray-500 flex-shrink-0">To</span>
                    <div className="flex-1 min-w-0">
                        <RecipientInput
                            recipients={recipients}
                            onRecipientsChange={(newList) => {
                                setRecipients(newList);
                                setErrorMsg(null);
                            }}
                        />
                    </div>
                    <div className="flex-shrink-0 pl-2">
                        <CsvUploader
                            onRecipientsUploaded={(newList) => {
                                setRecipients(newList);
                                setErrorMsg(null);
                            }}
                            onClearList={() => setRecipients([])}
                            currentCount={recipients.length}
                        />
                    </div>
                </div>

                {/* Subject Row */}
                <div className="flex items-center space-x-4 text-xs pb-2 border-b border-gray-100">
                    <span className="w-12 font-medium text-gray-500">Subject</span>
                    <input
                        type="text"
                        placeholder="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="flex-1 py-1 text-xs text-gray-900 placeholder-gray-400 bg-transparent border-none focus:outline-none"
                    />
                </div>

                {/* Throttling & Rate Limit Row matching Figma */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 py-1">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-500">Delay between 2 emails</span>
                        <input
                            type="number"
                            min="1"
                            max="300"
                            value={delayBetweenSeconds}
                            onChange={(e) => setDelayBetweenSeconds(parseInt(e.target.value) || 2)}
                            className="w-12 px-2 py-1 bg-[#f1f3f4] border border-transparent focus:border-[#00a854] focus:bg-white rounded-md text-center text-xs font-semibold text-gray-900 focus:outline-none"
                        />
                        <span className="text-gray-400 text-[11px]">sec</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-500">Hourly Limit</span>
                        <input
                            type="number"
                            min="1"
                            max="5000"
                            value={hourlyLimit}
                            onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 200)}
                            className="w-16 px-2 py-1 bg-[#f1f3f4] border border-transparent focus:border-[#00a854] focus:bg-white rounded-md text-center text-xs font-semibold text-gray-900 focus:outline-none"
                        />
                        <span className="text-gray-400 text-[11px]">/ hr</span>
                    </div>

                    {scheduledAt && (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#fff3e0] text-[#d97706] text-[11px] font-medium border border-[#ffe0b2]">
                            <Clock className="w-3 h-3 text-[#d97706]" />
                            <span>
                                Scheduled for:{' '}
                                {new Date(scheduledAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                            <button
                                type="button"
                                onClick={() => setScheduledAt('')}
                                className="ml-1 text-gray-400 hover:text-red-500"
                                title="Remove schedule"
                            >
                                ×
                            </button>
                        </div>
                    )}
                </div>

                {/* Rich Text Editor matching Figma */}
                <div className="pt-2">
                    <RichTextEditor content={bodyHtml} onChange={setBodyHtml} />
                </div>
            </div>

            {/* Schedule Panel matching Figma Send Later popover */}
            {showSchedulePanel && (
                <SchedulePanel
                    scheduledAt={scheduledAt}
                    delayBetweenSeconds={delayBetweenSeconds}
                    hourlyLimit={hourlyLimit}
                    onScheduleChange={(time, d, l) => {
                        setScheduledAt(time);
                        setDelayBetweenSeconds(d);
                        setHourlyLimit(l);
                    }}
                    onClose={() => setShowSchedulePanel(false)}
                    onConfirmSchedule={(time, d, l) => {
                        setScheduledAt(time);
                        setDelayBetweenSeconds(d);
                        setHourlyLimit(l);
                        setShowSchedulePanel(false);
                    }}
                />
            )}

            {/* Bulk Campaign Summary Modal */}
            {showSummaryModal && (
                <CampaignSummaryModal
                    isOpen={showSummaryModal}
                    onClose={() => setShowSummaryModal(false)}
                    onConfirm={() => {
                        if (pendingSchedule || scheduledAt) {
                            executeSchedule(pendingSchedule);
                        } else {
                            executeImmediateSend();
                        }
                    }}
                    recipientCount={recipients.length}
                    senderEmail={displayEmail}
                    subject={subject}
                    scheduledAt={pendingSchedule?.scheduledAt || scheduledAt}
                    delayBetweenSeconds={pendingSchedule?.delayBetweenSeconds || delayBetweenSeconds}
                    hourlyLimit={pendingSchedule?.hourlyLimit || hourlyLimit}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}
