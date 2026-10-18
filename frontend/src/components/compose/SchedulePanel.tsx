'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';

interface SchedulePanelProps {
    scheduledAt: string;
    delayBetweenSeconds: number;
    hourlyLimit: number;
    onScheduleChange: (scheduledAt: string, delay: number, limit: number) => void;
    onClose: () => void;
    onConfirmSchedule: (scheduledAt: string, delay: number, limit: number) => void;
}

export default function SchedulePanel({
    scheduledAt,
    delayBetweenSeconds,
    hourlyLimit,
    onScheduleChange,
    onClose,
    onConfirmSchedule,
}: SchedulePanelProps) {
    const buildLocalDate = (date: string, time: string): Date => {
        try {
            if (!date || !time) return new Date(Date.now() + 2 * 60 * 1000);
            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = time.split(':').map(Number);
            const d = new Date(year, month - 1, day, hours, minutes);
            if (isNaN(d.getTime())) return new Date(Date.now() + 2 * 60 * 1000);
            return d;
        } catch (e) {
            return new Date(Date.now() + 2 * 60 * 1000);
        }
    };

    const toLocalDateStr = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    };

    const toLocalTimeStr = (d: Date): string => {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    const [dateStr, setDateStr] = useState<string>(() => {
        const d = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        return toLocalDateStr(d);
    });

    const [timeStr, setTimeStr] = useState<string>(() => {
        const d = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        return toLocalTimeStr(d);
    });

    const applyTomorrowTime = (hour: number, minute: number = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(hour, minute, 0, 0);
        setDateStr(toLocalDateStr(d));
        setTimeStr(toLocalTimeStr(d));
    };

    const handleDone = () => {
        const localDate = buildLocalDate(dateStr, timeStr);
        const scheduledAtIso = localDate.toISOString();
        onScheduleChange(scheduledAtIso, delayBetweenSeconds, hourlyLimit);
        onConfirmSchedule(scheduledAtIso, delayBetweenSeconds, hourlyLimit);
    };

    return (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-gray-100 text-gray-900 animate-in fade-in zoom-in-95 duration-100">
                {/* Header matching Figma "Send Later" */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Send Later</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Pick Date & Time Input matching Figma */}
                <div className="mb-4">
                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
                        Pick date & time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            value={dateStr}
                            min={toLocalDateStr(new Date())}
                            onChange={(e) => setDateStr(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#f1f3f4] text-gray-900 text-xs border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none"
                        />
                        <input
                            type="time"
                            value={timeStr}
                            onChange={(e) => setTimeStr(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#f1f3f4] text-gray-900 text-xs border border-transparent focus:border-[#00a854] focus:bg-white focus:outline-none"
                        />
                    </div>
                </div>

                {/* Quick Presets matching Figma */}
                <div className="space-y-1 mb-5">
                    <button
                        type="button"
                        onClick={() => applyTomorrowTime(9, 0)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-[#e6f4ea] hover:text-[#00a854] transition-colors"
                    >
                        Tomorrow
                    </button>
                    <button
                        type="button"
                        onClick={() => applyTomorrowTime(10, 0)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-[#e6f4ea] hover:text-[#00a854] transition-colors"
                    >
                        Tomorrow, 10:00 AM
                    </button>
                    <button
                        type="button"
                        onClick={() => applyTomorrowTime(11, 0)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-[#e6f4ea] hover:text-[#00a854] transition-colors"
                    >
                        Tomorrow, 11:00 AM
                    </button>
                    <button
                        type="button"
                        onClick={() => applyTomorrowTime(15, 0)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-[#e6f4ea] hover:text-[#00a854] transition-colors"
                    >
                        Tomorrow, 3:00 PM
                    </button>
                </div>

                {/* Footer Buttons matching Figma Cancel / Done */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDone}
                        className="py-1.5 px-4 rounded-full border-2 border-[#00a854] text-[#00a854] hover:bg-[#e6f4ea] font-semibold text-xs transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
