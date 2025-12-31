import React from 'react';
import { Metadata } from 'next';
import RootDashboardPage from '@/components/(root)/dashboard/RootDashboardPage';

export const metadata: Metadata = {
    title: 'Dashboard | Job Portal',
    description: 'View your lead analytics, task overview, and team performance metrics. Track daily, monthly, and yearly progress with interactive charts and insights.',
};

export default function DashboardPage() {
    return <RootDashboardPage />;
}
