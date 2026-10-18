'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import EmailDetail from '@/components/email/EmailDetail';
import { useQuery } from '@tanstack/react-query';
import { fetchEmailDetail } from '@/lib/api/emails';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function EmailDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['email-detail', id],
        queryFn: () => fetchEmailDetail(id),
        enabled: !!id,
        staleTime: 1000,
        refetchInterval: 2000,
    });

    return (
        <AppShell>
            {isLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center text-gray-500 space-y-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#00a854]" />
                    <p className="text-xs font-medium">Loading email details...</p>
                </div>
            ) : isError || !data ? (
                <div className="max-w-md mx-auto my-12 p-6 bg-white border border-gray-200 rounded-2xl text-center text-gray-900 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-gray-900">Email Not Found</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">
                        The requested email could not be located in the database.
                    </p>
                </div>
            ) : (
                <EmailDetail email={data} />
            )}
        </AppShell>
    );
}
