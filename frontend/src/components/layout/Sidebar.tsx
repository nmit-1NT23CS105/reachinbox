'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Send, ChevronDown, LogOut, Activity, Hash } from 'lucide-react';
import { User } from '@/types';
import { logoutUser } from '@/lib/api/auth';
import SlackModal from './SlackModal';

interface SidebarProps {
    user?: User | null;
    scheduledCount?: number;
    sentCount?: number;
}

export default function Sidebar({ user, scheduledCount = 0, sentCount = 0 }: SidebarProps) {
    const pathname = usePathname();
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showSlackModal, setShowSlackModal] = useState(false);

    const isScheduledActive = pathname.includes('/scheduled');
    const isSentActive = pathname.includes('/sent');

    const displayName = user?.name || 'Oliver Brown';
    const displayEmail = user?.email || 'oliver.brown@domain.io';
    const avatarUrl =
        user?.avatarUrl ||
        user?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return (
        <>
            <aside className="w-56 lg:w-60 bg-white border-r border-gray-100 flex flex-col h-screen flex-shrink-0 font-sans z-20">
                {/* Logo Section matching Figma "ONE" / ReachInbox */}
                <div className="px-5 pt-5 pb-4">
                    <Link href="/dashboard/scheduled" className="flex items-center space-x-2">
                        <span className="text-xl font-black tracking-tight text-gray-900">ONE</span>
                    </Link>
                </div>

                {/* User Profile Pill matching Figma */}
                <div className="px-3 pb-3 relative">
                    <button
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-[#f1f3f4] hover:bg-gray-200/80 transition-colors text-left"
                    >
                        <div className="flex items-center space-x-2.5 min-w-0">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-[#00a854] text-white font-semibold flex items-center justify-center text-[10px] flex-shrink-0">
                                    {initials}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                                    {displayName}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate leading-tight">
                                    {displayEmail}
                                </p>
                            </div>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 ml-1" />
                    </button>

                    {showUserDropdown && (
                        <div className="absolute left-3 right-3 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg p-1.5 z-50 text-xs">
                            <button
                                onClick={() => setShowSlackModal(true)}
                                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-medium"
                            >
                                <Hash className="w-3.5 h-3.5 text-amber-500" />
                                <span>Slack Alerts</span>
                            </button>
                            <a
                                href="http://localhost:5000/admin/queues"
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-medium"
                            >
                                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                <span>BullMQ Monitor</span>
                            </a>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                                onClick={() => logoutUser()}
                                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-medium"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Compose Button matching Figma */}
                <div className="px-3 pb-4">
                    <Link
                        href="/dashboard/compose"
                        className="w-full py-2 px-4 rounded-full border-2 border-[#00a854] bg-white hover:bg-[#e6f4ea] text-[#00a854] font-semibold text-xs flex items-center justify-center transition-colors shadow-2xs"
                    >
                        <span>Compose</span>
                    </Link>
                </div>

                {/* Navigation Items (CORE) matching Figma */}
                <div className="px-3 space-y-1 flex-1">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        CORE
                    </div>

                    <Link
                        href="/dashboard/scheduled"
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                            isScheduledActive
                                ? 'bg-[#e6f4ea] text-[#00a854] font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <div className="flex items-center space-x-2.5">
                            <Clock className={`w-3.5 h-3.5 ${isScheduledActive ? 'text-[#00a854]' : 'text-gray-500'}`} />
                            <span>Scheduled</span>
                        </div>
                        {scheduledCount > 0 && (
                            <span className="text-[11px] font-medium text-gray-500">
                                {scheduledCount}
                            </span>
                        )}
                    </Link>

                    <Link
                        href="/dashboard/sent"
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                            isSentActive
                                ? 'bg-[#e6f4ea] text-[#00a854] font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <div className="flex items-center space-x-2.5">
                            <Send className={`w-3.5 h-3.5 ${isSentActive ? 'text-[#00a854]' : 'text-gray-500'}`} />
                            <span>Sent</span>
                        </div>
                        {sentCount > 0 && (
                            <span className="text-[11px] font-medium text-gray-500">
                                {sentCount}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Footer Quick Links */}
                <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <button
                        onClick={() => setShowSlackModal(true)}
                        className="hover:text-gray-900 flex items-center space-x-1"
                        title="Configure Slack Webhook"
                    >
                        <Hash className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px]">Slack</span>
                    </button>
                    <a
                        href="http://localhost:5000/admin/queues"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-gray-900 flex items-center space-x-1"
                        title="Live BullMQ Queue Monitor"
                    >
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px]">Queues</span>
                    </a>
                </div>
            </aside>

            <SlackModal isOpen={showSlackModal} onClose={() => setShowSlackModal(false)} />
        </>
    );
}
