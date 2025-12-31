import React from 'react';
import { Metadata } from 'next';
import RootMembersPage from '@/components/(root)/members/RootMembersPage';

export const metadata: Metadata = {
    title: 'Members | Job Portal',
    description: 'Manage team members, view account status, and unlock locked accounts.',
};

export default function MembersPage() {
    return <RootMembersPage />;
}
