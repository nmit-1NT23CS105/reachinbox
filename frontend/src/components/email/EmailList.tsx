'use client';

import React from 'react';
import EmailRow from './EmailRow';
import { EmailListItem, Pagination } from '@/types';
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import Link from 'next/link';

interface EmailListProps {
    emails: EmailListItem[];
    pagination?: Pagination;
    isLoading?: boolean;
    onPageChange?: (newPage: number) => void;
    emptyTitle?: string;
    emptyDescription?: string;
    showComposeButton?: boolean;
}

export default function EmailList({
    emails,
    pagination,
    isLoading,
    onPageChange,
    emptyTitle = 'No emails found',
    emptyDescription = 'Emails will appear here once scheduled or sent.',
    showComposeButton = true,
}: EmailListProps) {
    if (isLoading) {
        return (
            <div className="bg-white divide-y divide-gray-100 animate-pulse rounded-xl border border-gray-100">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                            <div className="w-32 h-4 bg-gray-100 rounded" />
                            <div className="w-24 h-4 bg-gray-100 rounded-full" />
                            <div className="w-64 h-4 bg-gray-100 rounded" />
                        </div>
                        <div className="w-16 h-4 bg-gray-100 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!emails || emails.length === 0) {
        return (
            <div className="py-20 px-6 text-center bg-white rounded-2xl border border-gray-100 my-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#e6f4ea] text-[#00a854] flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-[#00a854]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{emptyTitle}</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto leading-relaxed">
                    {emptyDescription}
                </p>
                {showComposeButton && (
                    <Link
                        href="/dashboard/compose"
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full border-2 border-[#00a854] bg-white hover:bg-[#e6f4ea] text-[#00a854] text-xs font-semibold transition-colors shadow-2xs"
                    >
                        <span>+ Compose</span>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
            <div className="divide-y divide-gray-100">
                {emails.map((email) => (
                    <EmailRow key={email.id} email={email} />
                ))}
            </div>

            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
                    <div>
                        Showing <span className="font-semibold text-gray-800">{(pagination.page - 1) * pagination.limit + 1}</span>–
                        <span className="font-semibold text-gray-800">
                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-semibold text-gray-800">{pagination.total}</span> emails
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onPageChange?.(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="p-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-medium text-gray-700 px-1 text-[11px]">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => onPageChange?.(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
