import React from 'react';
import { Metadata } from 'next';
import RootLogsPage from '@/components/(root)/logs/RootLogsPage';

export const metadata: Metadata = {
    title: 'Logs | Job Portal',
    description: 'This is the logs page',
};

export default function LogsPage() {
    return <RootLogsPage />;
}
