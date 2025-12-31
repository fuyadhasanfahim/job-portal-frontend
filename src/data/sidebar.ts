import {
    IconAd2,
    IconFileTypeXls,
    IconFolders,
    IconLayoutDashboard,
    IconLogs,
    IconTrash,
    IconUserPlus,
    IconUsersGroup,
} from '@tabler/icons-react';

export const data = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        access: ['super-admin', 'admin', 'telemarketer', 'lead-generator'],
        icon: IconLayoutDashboard,
    },
    {
        title: 'Leads',
        url: '/leads',
        access: ['super-admin', 'admin', 'lead-generator', 'telemarketer'],
        icon: IconFileTypeXls,
    },
    {
        title: 'Groups',
        url: '/groups',
        access: ['super-admin', 'admin'],
        icon: IconFolders,
    },
    {
        title: 'Tasks',
        url: '/tasks',
        access: ['super-admin', 'admin', 'lead-generator', 'telemarketer'],
        icon: IconAd2,
    },
    {
        title: 'Invitations',
        url: '/invitations',
        access: ['super-admin', 'admin'],
        icon: IconUserPlus,
    },
    {
        title: 'Members',
        url: '/members',
        access: ['super-admin', 'admin'],
        icon: IconUsersGroup,
    },
    {
        title: 'Logs',
        url: '/logs',
        access: ['super-admin', 'admin'],
        icon: IconLogs,
    },
    {
        title: 'Trash',
        url: '/trash',
        access: ['super-admin', 'admin'],
        icon: IconTrash,
    },
];
