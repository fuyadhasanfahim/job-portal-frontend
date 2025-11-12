/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import {
    useGetLeadAnalyticsQuery,
    useGetUserLeadStatsQuery,
    useGetTopUsersPieChartQuery,
    useGetAllUsersTableQuery,
} from '@/redux/features/log/logApi';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import {
    Table,
    TableHeader,
    TableHead,
    TableRow,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Calendar, Users, TrendingUp } from 'lucide-react';

const COLORS = [
    '#009999',
    '#ff6a00',
    '#2563eb',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
];

export default function RootLogsPage() {
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [barChartPeriod, setBarChartPeriod] = useState<string>('daily');
    const [pieChartPeriod, setPieChartPeriod] = useState<string>('daily');
    const [tablePage, setTablePage] = useState<number>(1);
    const [tableSearch, setTableSearch] = useState<string>('');

    // Queries
    const { data: analytics, isLoading: loadingAnalytics } =
        useGetLeadAnalyticsQuery(selectedMonth);

    const { data: userStats, isLoading: loadingUserStats } =
        useGetUserLeadStatsQuery(barChartPeriod);

    const { data: pieChartData, isLoading: loadingPieChart } =
        useGetTopUsersPieChartQuery({ period: pieChartPeriod, limit: 10 });

    const { data: usersTable, isLoading: loadingUsersTable } =
        useGetAllUsersTableQuery({
            page: tablePage,
            limit: 10,
            search: tableSearch,
        });

    const hourlyData = analytics?.data?.hourly || [];
    const dailyData = analytics?.data?.daily || [];
    const monthlyData = analytics?.data?.monthly || [];

    // Transform user stats data for bar chart
    const transformedBarChartData = React.useMemo(() => {
        if (!userStats?.data) return [];

        const groupedData: Record<string, any> = {};

        userStats.data.forEach((stat: any) => {
            const period = stat.period;
            if (!groupedData[period]) {
                groupedData[period] = { period };
            }
            groupedData[period][`${stat.userName}_new`] = stat.newCount;
            groupedData[period][`${stat.userName}_notNew`] = stat.notNewCount;
            groupedData[period][stat.userName] = stat.totalCount;
        });

        return Object.values(groupedData);
    }, [userStats]);

    // Get unique users for bar chart
    const uniqueUsers = React.useMemo((): string[] => {
        if (!userStats?.data) return [];
        const users = new Set(userStats.data.map((stat: any) => stat.userName));
        return Array.from(users) as string[];
    }, [userStats]);

    // Custom tooltip for bar chart
    const CustomBarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span>{entry.name}:</span>
                            <span className="font-semibold">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for pie chart
    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold mb-2">{data.userName}</p>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                            <span>New:</span>
                            <span className="font-semibold text-green-600">
                                {data.newCount}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Not New:</span>
                            <span className="font-semibold text-blue-600">
                                {data.notNewCount}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4 border-t pt-1">
                            <span>Total:</span>
                            <span className="font-bold">{data.totalCount}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 p-6">
            {/* Heading */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Lead Analytics Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Comprehensive overview of lead performance and user activity
                    </p>
                </div>

                {/* Month Filter */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-[160px]"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {loadingAnalytics ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Today</CardTitle>
                                <CardDescription>Leads created today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">
                                    {analytics?.data?.summary?.today ?? 0}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>This Month</CardTitle>
                                <CardDescription>
                                    Leads created this month
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">
                                    {analytics?.data?.summary?.month ?? 0}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>This Year</CardTitle>
                                <CardDescription>
                                    Leads created this year
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">
                                    {analytics?.data?.summary?.year ?? 0}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Total</CardTitle>
                                <CardDescription>All-time leads</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">
                                    {analytics?.data?.summary?.total ?? 0}
                                </p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* User Lead Statistics Bar Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                User Lead Creation Statistics
                            </CardTitle>
                            <CardDescription>
                                Compare lead creation across users (hover for details)
                            </CardDescription>
                        </div>
                        <Select
                            value={barChartPeriod}
                            onValueChange={setBarChartPeriod}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-96">
                        {loadingUserStats ? (
                            <Skeleton className="h-full w-full rounded-md" />
                        ) : transformedBarChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={transformedBarChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="period"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip content={<CustomBarTooltip />} />
                                    <Legend />
                                    {uniqueUsers.map((user: string, index: number) => (
                                        <Bar
                                            key={user}
                                            dataKey={user}
                                            fill={COLORS[index % COLORS.length]}
                                            stackId="a"
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No data available for selected period
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Top Users Pie Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Top Users by Lead Creation
                            </CardTitle>
                            <CardDescription>
                                Top 10 users ranked by total leads created
                            </CardDescription>
                        </div>
                        <Select
                            value={pieChartPeriod}
                            onValueChange={setPieChartPeriod}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily (30 days)</SelectItem>
                                <SelectItem value="monthly">Monthly (1 year)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-96">
                        {loadingPieChart ? (
                            <Skeleton className="h-full w-full rounded-md" />
                        ) : pieChartData?.data && pieChartData.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData.data}
                                        dataKey="totalCount"
                                        nameKey="userName"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={120}
                                        label={(entry) =>
                                            `${entry.userName}: ${entry.totalCount}`
                                        }
                                    >
                                        {pieChartData.data.map((_: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No data available for selected period
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Lead Growth Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Lead Growth Trends</CardTitle>
                    <CardDescription>
                        Hourly, daily, and monthly analytics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="daily" className="w-full">
                        <TabsList>
                            <TabsTrigger value="hourly">Hourly</TabsTrigger>
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        </TabsList>

                        <TabsContent value="hourly">
                            <div className="h-80">
                                {loadingAnalytics ? (
                                    <Skeleton className="h-80 w-full rounded-md" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={hourlyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="hour"
                                                label={{
                                                    value: 'Hour',
                                                    position: 'insideBottom',
                                                    offset: -5,
                                                }}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#009999"
                                                strokeWidth={2}
                                                dot
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="daily">
                            <div className="h-80">
                                {loadingAnalytics ? (
                                    <Skeleton className="h-80 w-full rounded-md" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#ff6a00"
                                                strokeWidth={2}
                                                dot
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="monthly">
                            <div className="h-80">
                                {loadingAnalytics ? (
                                    <Skeleton className="h-80 w-full rounded-md" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#2563eb"
                                                strokeWidth={2}
                                                dot
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* All Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users (Excluding Admins)</CardTitle>
                    <CardDescription>
                        Complete user list with lead statistics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingUsersTable ? (
                        <Skeleton className="h-96 w-full rounded-md" />
                    ) : (
                        <>
                            <div className="flex justify-end pb-3">
                                <Input
                                    placeholder="Search users..."
                                    value={tableSearch}
                                    onChange={(e) => setTableSearch(e.target.value)}
                                    className="max-w-xs"
                                />
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">
                                                New Leads
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Not New
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Total Leads
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersTable?.users?.length ? (
                                            usersTable.users.map(
                                                (
                                                    u: {
                                                        image: string;
                                                        firstName: string;
                                                        lastName: string;
                                                        email: string;
                                                        role: string;
                                                        newLeads: number;
                                                        notNewLeads: number;
                                                        totalLeads: number;
                                                    },
                                                    idx: number
                                                ) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarImage
                                                                    src={u.image || ''}
                                                                />
                                                                <AvatarFallback>
                                                                    {u.firstName?.[0] ?? '?'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {u.firstName} {u.lastName}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{u.email}</TableCell>
                                                        <TableCell>
                                                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                                                                {u.role}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold text-green-600">
                                                            {u.newLeads}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold text-blue-600">
                                                            {u.notNewLeads}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            {u.totalLeads}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="text-center text-muted-foreground h-32"
                                                >
                                                    No user data found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {usersTable?.pagination && (
                                <div className="flex items-center justify-between pt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {usersTable.users.length} of{' '}
                                        {usersTable.pagination.totalItems} users
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                setTablePage((prev) =>
                                                    Math.max(1, prev - 1)
                                                )
                                            }
                                            disabled={tablePage === 1}
                                            className="px-3 py-1 border rounded disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-3 py-1">
                                            Page {tablePage} of{' '}
                                            {usersTable.pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setTablePage((prev) =>
                                                    Math.min(
                                                        usersTable.pagination
                                                            .totalPages,
                                                        prev + 1
                                                    )
                                                )
                                            }
                                            disabled={
                                                tablePage ===
                                                usersTable.pagination.totalPages
                                            }
                                            className="px-3 py-1 border rounded disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}