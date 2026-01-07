'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDownIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetTasksQuery } from '@/redux/features/task/taskApi';
import { formatDistanceToNow } from 'date-fns';
import { ITask } from '@/types/task.interface';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useSignedUser } from '@/hooks/useSignedUser';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { IconPlus } from '@tabler/icons-react';
import { useGetAllUsersQuery } from '@/redux/features/user/userApi';
import { IUser } from '@/types/user.interface';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const roles = [
    'all',
    'lead-generator',
    'telemarketer',
    'digital-marketer',
    'seo-executive',
    'social-media-executive',
    'web-developer',
    'photo-editor',
    'graphic-designer',
];

const taskStatuses = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function RootTaskPage() {
    const { user } = useSignedUser();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [open, setOpen] = useState(false);

    const { data, isLoading } = useGetTasksQuery({
        page,
        limit,
        selectedUserId,
        status: selectedStatus,
        date: date ? date.toLocaleDateString('en-CA') : '',
    });

    const {
        data: usersData,
        isLoading: usersLoading,
        isFetching: usersFetching,
    } = useGetAllUsersQuery({
        role: selectedRole,
        userId: selectedUserId,
    });

    const tasks = data?.data ?? [];
    const pagination = data?.pagination ?? {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        limit,
    };

    const start = (pagination.currentPage - 1) * pagination.limit + 1;
    const end = Math.min(
        pagination.currentPage * pagination.limit,
        pagination.totalItems
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {user?.role === 'admin' || user?.role === 'super-admin'
                        ? 'All Tasks'
                        : 'My Tasks'}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* ✅ Tabs for task status filter */}
                <Tabs
                    value={selectedStatus}
                    onValueChange={(val) => {
                        setSelectedStatus(val);
                        setPage(1);
                    }}
                    className="w-full"
                >
                    <TabsList className="w-full flex flex-wrap justify-start">
                        {taskStatuses.map((s) => (
                            <TabsTrigger
                                key={s.value}
                                value={s.value}
                                className="capitalize"
                            >
                                {s.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={selectedStatus}>
                        <div className="w-full">
                            {/* ✅ Filters */}
                            <div className="flex gap-4 items-center justify-end mt-4">
                                {user?.role === 'admin' ||
                                    (user?.role === 'super-admin' && (
                                        <>
                                            <Select
                                                value={selectedRole}
                                                onValueChange={(val) =>
                                                    setSelectedRole(val)
                                                }
                                            >
                                                <SelectTrigger
                                                    id="role"
                                                    className="capitalize"
                                                >
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((r, i) => (
                                                        <SelectItem
                                                            key={i}
                                                            value={r}
                                                            className="capitalize"
                                                        >
                                                            {r.replace(
                                                                '-',
                                                                ' '
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Select
                                                value={selectedUserId}
                                                onValueChange={(val) =>
                                                    setSelectedUserId(val)
                                                }
                                            >
                                                <SelectTrigger
                                                    id="users"
                                                    className="capitalize"
                                                >
                                                    <SelectValue placeholder="Select user" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All
                                                    </SelectItem>
                                                    {usersLoading ||
                                                        usersFetching ? (
                                                        <div className="space-y-2 p-2">
                                                            {Array.from({
                                                                length: 5,
                                                            }).map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-center gap-2 w-full"
                                                                >
                                                                    <Skeleton className="h-6 w-6 rounded-full" />
                                                                    <div className="space-y-1">
                                                                        <Skeleton className="h-3 w-32" />
                                                                        <Skeleton className="h-2 w-20" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : usersData?.users
                                                        ?.length > 0 ? (
                                                        usersData?.users?.map(
                                                            (u: IUser) => (
                                                                <SelectItem
                                                                    key={u._id}
                                                                    value={
                                                                        u._id
                                                                    }
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-6 w-6">
                                                                            <AvatarImage
                                                                                src={
                                                                                    u.image ||
                                                                                    ''
                                                                                }
                                                                                alt={
                                                                                    u.firstName ||
                                                                                    'User'
                                                                                }
                                                                            />
                                                                            <AvatarFallback>
                                                                                {u.firstName?.[0]?.toUpperCase() ||
                                                                                    'U'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-medium">
                                                                                {
                                                                                    u.firstName
                                                                                }{' '}
                                                                                {
                                                                                    u.lastName
                                                                                }
                                                                            </span>
                                                                            <span className="text-muted-foreground capitalize">
                                                                                {u.role?.replace(
                                                                                    /-/g,
                                                                                    ' '
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            )
                                                        )
                                                    ) : (
                                                        <SelectItem
                                                            value="no-users"
                                                            disabled
                                                        >
                                                            No users found
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </>
                                    ))}

                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            id="date"
                                            className="w-auto justify-between font-normal"
                                        >
                                            {date
                                                ? date.toLocaleDateString()
                                                : 'Select date'}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                setDate(date);
                                                setOpen(false);
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Link
                                    href={'/tasks/create-task'}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Button variant={'outline'}>
                                        <IconPlus />
                                        Create Task
                                    </Button>
                                </Link>

                                <Select
                                    value={String(limit)}
                                    onValueChange={(val) => {
                                        setPage(1);
                                        setLimit(Number(val));
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] border-gray-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[20, 50, 100].map((n) => (
                                            <SelectItem
                                                key={n}
                                                value={String(n)}
                                            >
                                                {n} / page
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ✅ Table */}
                        <div className="mt-6 border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-xs font-semibold min-w-[180px] max-w-[220px]">
                                            Title
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold min-w-[80px] w-[80px]">
                                            Type
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold min-w-[140px]">
                                            Assigned To
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold min-w-[140px]">
                                            Created By
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold text-center w-[60px]">
                                            Leads
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold min-w-[90px] w-[90px]">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold text-center min-w-[100px] w-[100px]">
                                            Progress
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold min-w-[100px]">
                                            Created
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold min-w-[100px]">
                                            Finished
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold text-center w-[70px]">
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {isLoading && !tasks.length ? (
                                        Array.from({ length: 10 }).map(
                                            (_, i) => (
                                                <TableRow key={i} className="animate-pulse">
                                                    {Array.from({
                                                        length: 10,
                                                    }).map((__, j) => (
                                                        <TableCell
                                                            key={j}
                                                            className="py-3"
                                                        >
                                                            <Skeleton className="h-5 w-20 rounded-full" />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            )
                                        )
                                    ) : tasks.length ? (
                                        tasks.map((task: ITask) => (
                                            <TableRow key={task._id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium py-2.5 text-sm truncate max-w-[220px]">
                                                    {task.title || 'Untitled'}
                                                </TableCell>
                                                <TableCell className="capitalize text-sm py-2.5 truncate">
                                                    {task.type.replace(/_/g, ' ')}
                                                </TableCell>
                                                <TableCell className="text-sm py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={task.assignedTo?.image || ''} />
                                                            <AvatarFallback className="text-xs">
                                                                {task.assignedTo?.firstName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>{task.assignedTo?.firstName} {task.assignedTo?.lastName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={task.createdBy?.image || ''} />
                                                            <AvatarFallback className="text-xs">
                                                                {task.createdBy?.firstName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>{task.createdBy?.firstName} {task.createdBy?.lastName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-center py-2.5">
                                                    <Badge variant="outline" className="font-medium">
                                                        {task.leads?.length ?? 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2.5">
                                                    <Badge
                                                        variant={
                                                            task.status ===
                                                                'completed'
                                                                ? 'secondary'
                                                                : task.status ===
                                                                    'in_progress'
                                                                    ? 'default'
                                                                    : task.status ===
                                                                        'cancelled'
                                                                        ? 'destructive'
                                                                        : 'outline'
                                                        }
                                                        className={cn(
                                                            'capitalize text-xs',
                                                            task.status ===
                                                                'completed'
                                                                ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-100'
                                                                : task.status === 'in_progress'
                                                                ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100'
                                                                : ''
                                                        )}
                                                    >
                                                        {task.status.replace(
                                                            '_',
                                                            ' '
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div 
                                                                className={cn(
                                                                    "h-full transition-all",
                                                                    task.progress === 100 ? "bg-green-500" : "bg-primary"
                                                                )}
                                                                style={{ width: `${task.progress ?? 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium w-10">{task.progress ?? 0}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground py-2.5">
                                                    {task.createdAt
                                                        ? formatDistanceToNow(
                                                            new Date(
                                                                task.createdAt
                                                            ),
                                                            {
                                                                addSuffix:
                                                                    true,
                                                            }
                                                        )
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground py-2.5">
                                                    {task.finishedAt
                                                        ? formatDistanceToNow(
                                                            new Date(
                                                                task.finishedAt
                                                            ),
                                                            {
                                                                addSuffix:
                                                                    true,
                                                            }
                                                        )
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-center py-2.5">
                                                    <Link href={`/tasks/details/${task._id}`}>
                                                        <Button variant="ghost" size="sm" className="gap-1.5">
                                                            View
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={10}
                                                className="text-center py-16 text-muted-foreground"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <p>No tasks found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-4">
                <div className="text-sm text-gray-600">
                    Showing{' '}
                    <span className="font-medium text-gray-900">{start}</span>{' '}
                    to <span className="font-medium text-gray-900">{end}</span>{' '}
                    of{' '}
                    <span className="font-medium text-gray-900">
                        {pagination.totalItems}
                    </span>{' '}
                    tasks
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.currentPage === 1}
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        className="gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>

                    {/* Page Numbers */}
                    {(() => {
                        const totalPages = pagination.totalPages;
                        const currentPage = pagination.currentPage;
                        const pages: (number | string)[] = [];

                        if (totalPages <= 7) {
                            for (let i = 1; i <= totalPages; i++) {
                                pages.push(i);
                            }
                        } else {
                            pages.push(1);

                            if (currentPage > 3) {
                                pages.push('...');
                            }

                            const start = Math.max(2, currentPage - 1);
                            const end = Math.min(totalPages - 1, currentPage + 1);

                            for (let i = start; i <= end; i++) {
                                if (!pages.includes(i)) {
                                    pages.push(i);
                                }
                            }

                            if (currentPage < totalPages - 2) {
                                pages.push('...');
                            }

                            if (!pages.includes(totalPages)) {
                                pages.push(totalPages);
                            }
                        }

                        return pages.map((p, idx) => (
                            p === '...' ? (
                                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                                    ...
                                </span>
                            ) : (
                                <Button
                                    key={p}
                                    variant={currentPage === p ? 'default' : 'outline'}
                                    size="sm"
                                    className="min-w-[36px]"
                                    onClick={() => setPage(p as number)}
                                >
                                    {p}
                                </Button>
                            )
                        ));
                    })()}

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={
                            pagination.currentPage === pagination.totalPages ||
                            pagination.totalPages === 0
                        }
                        onClick={() =>
                            setPage((p) =>
                                Math.min(p + 1, pagination.totalPages || p + 1)
                            )
                        }
                        className="gap-1"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
