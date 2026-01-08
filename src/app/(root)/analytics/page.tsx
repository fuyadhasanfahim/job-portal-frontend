import React from 'react';
import { Metadata } from 'next';
import RootAnalyticsPage from '@/components/(root)/analytics/RootAnalyticsPage';

export const metadata: Metadata = {
    title: 'Analytics | Lead Portal',
    description: 'Analytics dashboard for lead management',
};

export default function AnalyticsPage() {
    return <RootAnalyticsPage />;
}
