import type { Metadata } from 'next';
import './globals.css';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';

export const metadata: Metadata = {
    title: 'ONE — Outbox Labs Email Scheduler & Outreach Platform',
    description: 'Production-grade cold email outreach and scheduling SaaS application with BullMQ queues.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="font-sans antialiased bg-white text-gray-900 selection:bg-[#e6f4ea] selection:text-[#00a854]">
                <ReactQueryProvider>{children}</ReactQueryProvider>
            </body>
        </html>
    );
}
