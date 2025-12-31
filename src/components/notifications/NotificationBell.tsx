'use client';

import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
} from '@/redux/features/notification/notificationApi';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface NotificationData {
    userId?: string;
    userName?: string;
    taskId?: string;
    taskTitle?: string;
    invitationId?: string;
    link?: string;
}

interface Notification {
    _id: string;
    type: 'invitation_accepted' | 'task_assigned' | 'task_completed';
    title: string;
    message: string;
    data?: NotificationData;
    read: boolean;
    createdAt: string;
}

const typeConfig = {
    invitation_accepted: {
        icon: '👋',
        gradient: 'from-green-500 to-emerald-500',
        bg: 'bg-green-50 dark:bg-green-950/30',
        border: 'border-green-200 dark:border-green-800',
    },
    task_assigned: {
        icon: '📋',
        gradient: 'from-blue-500 to-indigo-500',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
    },
    task_completed: {
        icon: '✅',
        gradient: 'from-purple-500 to-pink-500',
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        border: 'border-purple-200 dark:border-purple-800',
    },
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);

    const { data: countData } = useGetUnreadCountQuery(undefined, {
        pollingInterval: 30000,
    });

    const { data: notificationsData, isLoading } = useGetNotificationsQuery(
        { page: 1, limit: 10 },
        { skip: !open }
    );

    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();

    const unreadCount = countData?.count || 0;
    const notifications: Notification[] = notificationsData?.notifications || [];

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead(undefined);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative rounded-full h-10 w-10 hover:bg-accent transition-all duration-200"
                >
                    <Bell className="h-[18px] w-[18px]" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] flex items-center justify-center font-semibold shadow-lg animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[400px] p-0 rounded-2xl shadow-2xl border-0 overflow-hidden"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <h3 className="font-semibold text-lg">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/90 hover:text-white hover:bg-white/20 text-xs gap-1.5 h-8"
                                onClick={handleMarkAllAsRead}
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>

                <ScrollArea className="border-t h-[420px]">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-3 p-3">
                                    <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="p-3 space-y-2">
                            {notifications.map((notification) => {
                                const config = typeConfig[notification.type];
                                return (
                                    <div
                                        key={notification._id}
                                        className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${!notification.read
                                            ? `${config.bg} ${config.border}`
                                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {/* Unread indicator */}
                                        {!notification.read && (
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${config.gradient}`} />
                                        )}

                                        <div className="flex gap-3">
                                            {/* Icon */}
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-lg shadow-sm shrink-0`}>
                                                {config.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between mt-2.5">
                                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {notification.data?.link && (
                                                            <Link href={notification.data.link} onClick={() => setOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {!notification.read && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                onClick={(e) => handleMarkAsRead(notification._id, e)}
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            onClick={(e) => handleDelete(notification._id, e)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-16 px-4">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-5">
                                <Sparkles className="h-10 w-10 text-indigo-500" />
                            </div>
                            <h4 className="font-semibold text-lg mb-1">All caught up!</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
                                No new notifications. We&apos;ll let you know when something arrives.
                            </p>
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t bg-gray-50 dark:bg-gray-900 p-3">
                        <Link href="/user-profile/notifications" onClick={() => setOpen(false)}>
                            <Button
                                variant="ghost"
                                className="w-full text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                            >
                                View all notifications
                            </Button>
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
