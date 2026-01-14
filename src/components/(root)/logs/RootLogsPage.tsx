'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    RotateCcw,
    Activity,
    Calendar as CalendarIcon,
    AlertCircle,
    Info,
    AlertTriangle,
    Shield,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useGetActivityLogsQuery } from '@/redux/features/log/logApi';
import { useGetAllUsersQuery } from '@/redux/features/user/userApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ENTITY_TYPES = [
    'lead',
    'task',
    'user',
    'system',
    'trash',
    'group',
    'invitation',
    'other',
];

const LOG_LEVELS = ['info', 'warning', 'error', 'debug'];

// Types for logs page
interface UserOption {
    _id: string;
    firstName: string;
    lastName?: string;
}

interface LogUser {
    firstName?: string;
    lastName?: string;
    email?: string;
    image?: string;
}

interface LogEntry {
    _id: string;
    createdAt: string;
    level?: string;
    action: string;
    entityType: string;
    description: string;
    data?: Record<string, unknown>;
    user?: LogUser;
}

export default function RootLogsPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [userId, setUserId] = useState('all');
    const [entityType, setEntityType] = useState('all');
    const [level, setLevel] = useState('all');
    const [date, setDate] = useState<Date | undefined>(undefined);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch logs
    const { data, isLoading, isFetching } = useGetActivityLogsQuery({
        page,
        limit,
        search: debouncedSearch,
        userId: userId !== 'all' ? userId : undefined,
        entityType: entityType !== 'all' ? entityType : undefined,
        level: level !== 'all' ? level : undefined,
        startDate: date ? format(date, 'yyyy-MM-dd') : undefined,
        endDate: date ? format(date, 'yyyy-MM-dd') : undefined, // For single day filter
    });

    const logs = data?.logs ?? [];
    const pagination = data?.pagination ?? { totalItems: 0, totalPages: 1 };

    // Fetch users for filter
    const { data: usersData } = useGetAllUsersQuery({
        role: 'all',
        includeAdmins: true,
    });
    const users: UserOption[] = usersData?.users ?? [];

    const handleReset = () => {
        setSearch('');
        setUserId('all');
        setEntityType('all');
        setLevel('all');
        setDate(undefined);
        setPage(1);
    };

    const hasFilters =
        search ||
        userId !== 'all' ||
        entityType !== 'all' ||
        level !== 'all' ||
        date;

    const getLevelBadge = (lvl: string) => {
        switch (lvl) {
            case 'error':
                return (
                    <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" /> Error
                    </Badge>
                );
            case 'warning':
                return (
                    <Badge
                        variant="outline"
                        className="text-yellow-600 border-yellow-200 bg-yellow-50 gap-1"
                    >
                        <AlertTriangle className="h-3 w-3" /> Warning
                    </Badge>
                );
            case 'debug':
                return (
                    <Badge
                        variant="outline"
                        className="text-purple-600 border-purple-200 bg-purple-50 gap-1"
                    >
                        <Shield className="h-3 w-3" /> Debug
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="gap-1">
                        <Info className="h-3 w-3" /> Info
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        System Logs
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Monitor system activities and user actions.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Log Filters
                    </CardTitle>
                    <CardDescription>
                        Filter logs by user, type, level or date
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative w-full md:w-auto md:min-w-[200px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search logs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>

                        {/* User Filter */}
                        <Select
                            value={userId}
                            onValueChange={(val) => {
                                setUserId(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-9 w-[150px]">
                                <SelectValue placeholder="User" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {users.map((u) => (
                                    <SelectItem key={u._id} value={u._id}>
                                        {u.firstName} {u.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Entity Type Filter */}
                        <Select
                            value={entityType}
                            onValueChange={(val) => {
                                setEntityType(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-9 w-[140px]">
                                <SelectValue placeholder="Entity Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {ENTITY_TYPES.map((t) => (
                                    <SelectItem
                                        key={t}
                                        value={t}
                                        className="capitalize"
                                    >
                                        {t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Level Filter */}
                        <Select
                            value={level}
                            onValueChange={(val) => {
                                setLevel(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-9 w-[120px]">
                                <SelectValue placeholder="Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                {LOG_LEVELS.map((l) => (
                                    <SelectItem
                                        key={l}
                                        value={l}
                                        className="capitalize"
                                    >
                                        {l}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                        'w-[180px] h-9 justify-start text-left font-normal',
                                        !date && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? (
                                        format(date, 'PPP')
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => {
                                        setDate(d);
                                        setPage(1);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Reset */}
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                className="h-9 gap-1.5 ml-auto md:ml-0"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Reset
                            </Button>
                        )}
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">
                                        Timestamp
                                    </TableHead>
                                    <TableHead className="w-[100px]">
                                        Level
                                    </TableHead>
                                    <TableHead className="w-[200px]">
                                        User
                                    </TableHead>
                                    <TableHead className="w-[150px]">
                                        Action
                                    </TableHead>
                                    <TableHead className="w-[120px]">
                                        Entity
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading || isFetching ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-8 w-8 rounded-full inline-block mr-2" />
                                                <Skeleton className="h-4 w-24 inline-block" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-20" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-16" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-48" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="h-24 text-center"
                                        >
                                            No logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (logs as LogEntry[]).map((log) => (
                                        <TableRow
                                            key={log._id}
                                            className="group"
                                        >
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {format(
                                                    new Date(log.createdAt),
                                                    'PP pp'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getLevelBadge(
                                                    log.level || 'info'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {log.user ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage
                                                                src={
                                                                    log.user
                                                                        .image
                                                                }
                                                            />
                                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                                {
                                                                    log.user
                                                                        .firstName?.[0]
                                                                }
                                                                {
                                                                    log.user
                                                                        .lastName?.[0]
                                                                }
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium leading-none">
                                                                {
                                                                    log.user
                                                                        .firstName
                                                                }{' '}
                                                                {
                                                                    log.user
                                                                        .lastName
                                                                }
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {log.user.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm italic">
                                                        System/Guest
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize text-xs font-normal"
                                                >
                                                    {log.entityType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[400px]">
                                                <p className="text-sm truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                                    {log.description}
                                                </p>
                                                {log.data && (
                                                    <details className="mt-1">
                                                        <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-primary list-none flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                                            View Meta Data
                                                        </summary>
                                                        <pre className="mt-1 p-2 bg-muted/30 rounded text-[10px] overflow-auto max-h-[100px]">
                                                            {JSON.stringify(
                                                                log.data,
                                                                null,
                                                                2
                                                            )}
                                                        </pre>
                                                    </details>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>{(page - 1) * limit + 1}</strong> to{' '}
                            <strong>
                                {Math.min(page * limit, pagination.totalItems)}
                            </strong>{' '}
                            of <strong>{pagination.totalItems}</strong> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                disabled={page === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm px-2">
                                Page {page} of {pagination.totalPages || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= pagination.totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
