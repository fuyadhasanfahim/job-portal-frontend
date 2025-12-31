import React from 'react';
import { Metadata } from 'next';
import RootNotificationsPage from '@/components/(root)/notifications/RootNotificationsPage';

export const metadata: Metadata = {
    title: 'Notifications | Job Portal',
    description: 'View and manage all your notifications including task assignments, completions, and invitation updates.',
};

export default function NotificationsPage() {
    return <RootNotificationsPage />;
}
