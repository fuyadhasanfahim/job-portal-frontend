import {
    IconAd2,
    IconFileTypeXls,
    IconLayoutDashboard,
    IconLogs,
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
        title: 'Tasks',
        url: '/tasks',
        access: ['super-admin', 'admin', 'lead-generator', 'telemarketer'],
        icon: IconAd2,
    },
    {
        title: 'Logs',
        url: '/logs',
        access: ['super-admin', 'admin'],
        icon: IconLogs,
    },
];
