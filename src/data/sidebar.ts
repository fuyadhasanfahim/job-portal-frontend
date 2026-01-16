import {
    IconAd2,
    IconFileTypeXls,
    IconFolders,
    IconLayoutDashboard,
    IconLogs,
    IconTrash,
    IconUserPlus,
    IconUsersGroup,
    IconCalendarEvent,
    IconChartBar,
} from '@tabler/icons-react';

export const data = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        access: [
            'super-admin',
            'admin',
            'telemarketer',
            'lead-generator',
            'team-leader',
        ],
        icon: IconLayoutDashboard,
    },
    {
        title: 'Analytics',
        url: '/analytics',
        access: ['super-admin', 'admin', 'team-leader'],
        icon: IconChartBar,
    },
    {
        title: 'Leads',
        url: '/leads',
        access: [
            'super-admin',
            'admin',
            'lead-generator',
            'telemarketer',
            'team-leader',
        ],
        icon: IconFileTypeXls,
    },
    {
        title: 'Groups',
        url: '/groups',
        access: ['super-admin', 'admin', 'team-leader'],
        icon: IconFolders,
    },
    {
        title: 'Tasks',
        url: '/tasks',
        access: [
            'super-admin',
            'admin',
            'lead-generator',
            'telemarketer',
            'team-leader',
        ],
        icon: IconAd2,
    },
    {
        title: 'Schedules',
        url: '/schedules',
        access: ['super-admin', 'admin', 'telemarketer', 'team-leader'],
        icon: IconCalendarEvent,
    },
    {
        title: 'Invitations',
        url: '/invitations',
        access: ['super-admin', 'admin', 'team-leader'],
        icon: IconUserPlus,
    },
    {
        title: 'Members',
        url: '/members',
        access: ['super-admin', 'admin', 'team-leader'],
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
