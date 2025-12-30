import React from 'react';
import { Metadata } from 'next';
import InvitationsPage from '@/components/(root)/invitations/InvitationsPage';

export const metadata: Metadata = {
    title: 'Invitations | Job Portal',
};

export default function Page() {
    return <InvitationsPage />;
}
