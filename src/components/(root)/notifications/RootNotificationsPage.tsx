'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    ExternalLink,
    Sparkles,
    Loader2,
} from 'lucide-react';
import {
    useGetNotificationsQuery,
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
        label: 'Invitation Accepted',
    },
    task_assigned: {
        icon: '📋',
        gradient: 'from-blue-500 to-indigo-500',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        label: 'Task Assigned',
    },
    task_completed: {
        icon: '✅',
        gradient: 'from-purple-500 to-pink-500',
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        border: 'border-purple-200 dark:border-purple-800',
        label: 'Task Completed',
    },
};

export default function RootNotificationsPage() {
    const [page, setPage] = useState(1);
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isFetching } = useGetNotificationsQuery(
        { page, limit: 20 },
        { refetchOnMountOrArgChange: true }
    );

    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();

    // Update notifications when data changes
    useEffect(() => {
        if (data?.notifications) {
            if (page === 1) {
                setAllNotifications(data.notifications);
            } else {
                setAllNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n._id));
                    const newNotifications = data.notifications.filter(
                        (n: Notification) => !existingIds.has(n._id)
                    );
                    return [...prev, ...newNotifications];
                });
            }
            setHasMore(page < (data.pagination?.totalPages || 1));
        }
    }, [data, page]);

    // Infinite scroll observer
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (target.isIntersecting && hasMore && !isFetching) {
            setPage(prev => prev + 1);
        }
    }, [hasMore, isFetching]);

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element) return;

        observerRef.current = new IntersectionObserver(handleObserver, {
            threshold: 0.1,
        });

        observerRef.current.observe(element);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver]);

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        setAllNotifications(prev =>
            prev.map(n => (n._id === id ? { ...n, read: true } : n))
        );
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead(undefined);
        setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
        setAllNotifications(prev => prev.filter(n => n._id !== id));
    };

    const unreadCount = allNotifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                            <Bell className="h-6 w-6 text-white" />
                        </div>
                        Notifications
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                            : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleMarkAllAsRead}
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* Notifications List */}
            <Card>
                <CardHeader className="border-b">
                    <CardTitle className="text-lg">All Notifications</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading && page === 1 ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4 p-4 border rounded-xl">
                                    <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-1/3" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : allNotifications.length > 0 ? (
                        <div className="divide-y">
                            {allNotifications.map((notification) => {
                                const config = typeConfig[notification.type];
                                return (
                                    <div
                                        key={notification._id}
                                        className={`group relative p-5 transition-colors hover:bg-accent/50 ${!notification.read ? 'bg-accent/30' : ''
                                            }`}
                                    >
                                        {/* Unread indicator */}
                                        {!notification.read && (
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.gradient}`} />
                                        )}

                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-sm shrink-0`}>
                                                {config.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.border} border font-medium`}>
                                                                {config.label}
                                                            </span>
                                                            {!notification.read && (
                                                                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                                            )}
                                                        </div>
                                                        <h3 className="font-semibold text-base">
                                                            {notification.title}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {notification.data?.link && (
                                                            <Link href={notification.data.link}>
                                                                <Button variant="outline" size="sm" className="gap-1.5">
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                    View
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {!notification.read && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5"
                                                                onClick={() => handleMarkAsRead(notification._id)}
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                                Mark read
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 text-red-500 hover:text-red-600 hover:border-red-200"
                                                            onClick={() => handleDelete(notification._id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Infinite scroll trigger */}
                            <div ref={loadMoreRef} className="p-4 flex justify-center">
                                {isFetching && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading more...
                                    </div>
                                )}
                                {!hasMore && allNotifications.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No more notifications
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-6">
                                <Sparkles className="h-12 w-12 text-indigo-500" />
                            </div>
                            <h3 className="font-semibold text-xl mb-2">No notifications yet</h3>
                            <p className="text-muted-foreground text-center max-w-sm">
                                When you receive notifications about tasks, invitations, or other activities, they&apos;ll appear here.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
