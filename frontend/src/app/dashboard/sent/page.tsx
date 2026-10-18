'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import EmailList from '@/components/email/EmailList';
import { useQuery } from '@tanstack/react-query';
import { fetchSentEmails } from '@/lib/api/emails';

export default function SentEmailsPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['sent-emails', page, searchQuery],
        queryFn: () => fetchSentEmails({ page, limit: 10, search: searchQuery }),
        staleTime: 1000,
        refetchInterval: 2000,
        gcTime: 300000,
    });

    return (
        <AppShell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
            <div className="max-w-6xl mx-auto space-y-4">
                <EmailList
                    emails={data?.data || []}
                    pagination={data?.pagination}
                    isLoading={isLoading}
                    onPageChange={setPage}
                    emptyTitle="No sent emails yet"
                    emptyDescription="Emails that have been successfully delivered will appear in this log."
                />
            </div>
        </AppShell>
    );
}
