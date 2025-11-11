'use client';

import * as React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Cell,
    Label,
    LineChart,
    Line,
    CartesianGrid,
} from 'recharts';
import {
    Loader2,
    RefreshCw,
    Download,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ILog, ILogStatItem, IUserStatItem } from '@/types/logs.interface';
import { useGetLogsQuery } from '@/redux/features/log/logApi';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function RootLogsPage() {
    const [filters, setFilters] = React.useState({
        page: 1,
        limit: 50,
        action: 'all',
        entityType: 'all',
        userId: 'all',
        startDate: '',
        endDate: '',
        search: '',
    });

    const [showFilters, setShowFilters] = React.useState(false);

    const queryParams = Object.entries(filters)
        .filter(([_unknown, value]) => value && value !== 'all')
        .map(([key, value]) => `${key}=${value}`);

    const { data, isLoading, refetch, isFetching } = useGetLogsQuery(
        queryParams,
        { refetchOnMountOrArgChange: true }
    );

    const logs = data?.logs || [];
    const pagination = data?.pagination || {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        limit: 50,
    };
    const stats = data?.stats || {
        actions: [],
        entities: [],
        users: [],
        hourly: [],
        daily: [],
    };

    const colors = [
        '#0ea5e9',
        '#22c55e',
        '#eab308',
        '#ef4444',
        '#a855f7',
        '#14b8a6',
        '#f97316',
        '#ec4899',
    ];

    const chartConfig: ChartConfig = {
        count: { label: 'Count', color: '#0ea5e9' },
    };

    const actionData = stats.actions.map((item: ILogStatItem) => ({
        name: item._id,
        value: item.count,
    }));

    const entityData = stats.entities.map((item: ILogStatItem) => ({
        name: item._id,
        value: item.count,
    }));

    const userActivityData = stats.users.map((item: IUserStatItem) => ({
        name: item.firstName
            ? `${item.firstName} ${item.lastName || ''}`
            : 'System',
        count: item.count,
    }));

    const hourlyData = stats.hourly.map((item: ILogStatItem) => ({
        hour: `${item._id}:00`,
        count: item.count,
    }));

    const dailyData = stats.daily
        .slice()
        .reverse()
        .map((item: ILogStatItem) => ({
            date: new Date(item._id as string).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
            count: item.count,
        }));

    const updateFilter = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const getActionBadge = (action: string) => {
        const actionColors: Record<string, string> = {
            user_login: 'bg-green-500',
            user_signup: 'bg-blue-500',
            user_logout: 'bg-gray-500',
            create_lead: 'bg-purple-500',
            update_lead: 'bg-yellow-500',
            view_lead_details: 'bg-cyan-500',
            create_task: 'bg-indigo-500',
            update_task_progress: 'bg-orange-500',
            token_rotated: 'bg-slate-500',
            view_profile: 'bg-teal-500',
        };

        return (
            <Badge
                className={cn(
                    'text-white text-xs capitalize bg-gray-400',
                    actionColors[action]
                )}
            >
                {action.replace(/_/g, ' ')}
            </Badge>
        );
    };

    const getEntityBadge = (entityType: string) => {
        const entityColors: Record<string, string> = {
            lead: 'bg-blue-100 text-blue-800 border-blue-200',
            task: 'bg-purple-100 text-purple-800 border-purple-200',
            user: 'bg-green-100 text-green-800 border-green-200',
            system: 'bg-gray-100 text-gray-800 border-gray-200',
        };

        return (
            <Badge
                variant="outline"
                className={cn(
                    'bg-gray-100 capitalize',
                    entityColors[entityType]
                )}
            >
                {entityType}
            </Badge>
        );
    };

    const exportLogs = () => {
        const csvContent = [
            [
                'Date',
                'Action',
                'Entity Type',
                'Description',
                'User',
                'IP',
                'User Agent',
            ],
            ...logs.map((log: ILog) => [
                new Date(log.createdAt).toLocaleString(),
                log.action,
                log.entityType,
                log.description || '-',
                log.user?.firstName
                    ? `${log.user.firstName} ${log.user.lastName || ''}`
                    : 'System',
                log.ip || '-',
                log.userAgent || '-',
            ]),
        ]
            .map((row) => row.map((cell: string) => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (isLoading)
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                        Activity Logs & Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitor system activity and user behavior
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${
                                isFetching ? 'animate-spin' : ''
                            }`}
                        />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        {showFilters ? 'Hide' : 'Show'} Filters
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportLogs}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {pagination.totalItems.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all activities
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Unique Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.actions.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Different action types
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.users.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Users with activity
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Entity Types
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.entities.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Categories tracked
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filter Logs</CardTitle>
                        <CardDescription>
                            Refine your log search
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search logs..."
                                        value={filters.search}
                                        onChange={(e) =>
                                            updateFilter(
                                                'search',
                                                e.target.value
                                            )
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Action Type
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={filters.action}
                                    onChange={(e) =>
                                        updateFilter('action', e.target.value)
                                    }
                                >
                                    <option value="all">All Actions</option>
                                    {stats.actions.map((action: ILogStatItem) => (
                                        <option
                                            key={action._id}
                                            value={action._id as string}
                                        >
                                            {(action._id as string).replace(/_/g, ' ')} (
                                            {action.count})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Entity Type
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={filters.entityType}
                                    onChange={(e) =>
                                        updateFilter(
                                            'entityType',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="all">All Entities</option>
                                    {stats.entities.map((entity: ILogStatItem) => (
                                        <option
                                            key={entity._id}
                                            value={entity._id as string}
                                        >
                                            {entity._id} ({entity.count})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Items per page
                                </label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={filters.limit.toString()}
                                    onChange={(e) =>
                                        updateFilter(
                                            'limit',
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Start Date
                                </label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) =>
                                        updateFilter(
                                            'startDate',
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    End Date
                                </label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) =>
                                        updateFilter('endDate', e.target.value)
                                    }
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setFilters({
                                            page: 1,
                                            limit: 50,
                                            action: 'all',
                                            entityType: 'all',
                                            userId: 'all',
                                            startDate: '',
                                            endDate: '',
                                            search: '',
                                        })
                                    }
                                    className="w-full"
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Action Distribution Pie */}
                <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>Action Distribution</CardTitle>
                        <CardDescription>
                            Breakdown of log actions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-[280px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={actionData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}
                                    outerRadius={90}
                                    strokeWidth={5}
                                >
                                    {actionData.map((_: unknown, i: number) => (
                                        <Cell
                                            key={i}
                                            fill={colors[i % colors.length]}
                                        />
                                    ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            if (
                                                viewBox &&
                                                'cx' in viewBox &&
                                                'cy' in viewBox
                                            ) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-3xl font-bold"
                                                        >
                                                            {
                                                                pagination.totalItems
                                                            }
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={
                                                                (viewBox.cy ||
                                                                    0) + 24
                                                            }
                                                            className="fill-muted-foreground"
                                                        >
                                                            Total
                                                        </tspan>
                                                    </text>
                                                );
                                            }
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Entity Type Bar */}
                <Card>
                    <CardHeader>
                        <CardTitle>Entity Types</CardTitle>
                        <CardDescription>Logs by entity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig}>
                            <BarChart
                                width={300}
                                height={280}
                                data={entityData}
                            >
                                <XAxis dataKey="name" />
                                <YAxis />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            hideLabel={false}
                                        />
                                    }
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#22c55e"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* User Activity Bar */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Users</CardTitle>
                        <CardDescription>Most active users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig}>
                            <BarChart
                                width={300}
                                height={280}
                                data={userActivityData}
                                layout="vertical"
                            >
                                <XAxis type="number" />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={80}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            hideLabel={false}
                                        />
                                    }
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#a855f7"
                                    radius={[0, 6, 6, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Time-based Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hourlyData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Hourly Activity</CardTitle>
                            <CardDescription>
                                Activity distribution by hour
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig}>
                                <LineChart
                                    width={undefined}
                                    height={250}
                                    data={hourlyData}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" />
                                    <YAxis />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                hideLabel={false}
                                            />
                                        }
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#0ea5e9"
                                        strokeWidth={2}
                                        dot={{ fill: '#0ea5e9' }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}

                {dailyData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Activity Trend</CardTitle>
                            <CardDescription>
                                Last 30 days activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig}>
                                <LineChart
                                    width={undefined}
                                    height={250}
                                    data={dailyData}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                hideLabel={false}
                                            />
                                        }
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        dot={{ fill: '#22c55e' }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Activity Logs</CardTitle>
                    <CardDescription>
                        Detailed log entries (Page {pagination.currentPage} of{' '}
                        {pagination.totalPages})
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="">Sr</TableHead>
                                <TableHead className="w-[180px]">
                                    Timestamp
                                </TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead className="max-w-[300px]">
                                    Description
                                </TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="hidden lg:table-cell">
                                    IP Address
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        No logs found matching your filters
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log: ILog) => (
                                    <TableRow key={log._id}>
                                        <TableCell>
                                            {logs.indexOf(log) + 1}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {new Date(
                                                log.createdAt
                                            ).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {getActionBadge(log.action)}
                                        </TableCell>
                                        <TableCell>
                                            {getEntityBadge(log.entityType)}
                                        </TableCell>
                                        <TableCell
                                            className="max-w-[300px] truncate"
                                            title={log.description}
                                        >
                                            {log.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {log.user?.image && (
                                                    <Image
                                                        src={log.user.image}
                                                        width={24}
                                                        height={24}
                                                        alt=""
                                                        className="rounded-full"
                                                    />
                                                )}
                                                <span className="text-sm">
                                                    {log.user?.firstName
                                                        ? `${
                                                              log.user.firstName
                                                          } ${
                                                              log.user
                                                                  .lastName ||
                                                              ''
                                                          }`
                                                        : 'System'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell font-mono text-xs">
                                            {log.ip || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Showing{' '}
                                {(pagination.currentPage - 1) *
                                    pagination.limit +
                                    1}{' '}
                                to{' '}
                                {Math.min(
                                    pagination.currentPage * pagination.limit,
                                    pagination.totalItems
                                )}{' '}
                                of {pagination.totalItems} logs
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(
                                            pagination.currentPage - 1
                                        )
                                    }
                                    disabled={pagination.currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <div className="text-sm font-medium px-2">
                                    Page {pagination.currentPage} of{' '}
                                    {pagination.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(
                                            pagination.currentPage + 1
                                        )
                                    }
                                    disabled={
                                        pagination.currentPage >=
                                        pagination.totalPages
                                    }
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
