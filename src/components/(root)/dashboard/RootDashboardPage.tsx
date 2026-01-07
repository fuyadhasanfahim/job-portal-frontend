'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSignedUser } from '@/hooks/useSignedUser';
import { useGetLeadAnalyticsQuery, useGetTopUsersPieChartQuery } from '@/redux/features/log/logApi';
import { useGetTasksQuery } from '@/redux/features/task/taskApi';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import {
    Users,
    TrendingUp,
    Calendar,
    Target,
    ClipboardList,
    Globe,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Greeting based on time of day
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

// Chart colors
const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

interface TopUser {
    userName: string;
    totalCount: number;
    newCount: number;
    notNewCount: number;
}

interface MonthlyData {
    month: string;
    count: number;
}

interface CountryData {
    country: string;
    count: number;
}

export default function RootDashboardPage() {
    const { user } = useSignedUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

    const { data: analyticsData, isLoading: analyticsLoading } = useGetLeadAnalyticsQuery('', {
        skip: !isAdmin,
    });

    const { data: topUsersData, isLoading: topUsersLoading } = useGetTopUsersPieChartQuery(
        { period: 'monthly', limit: 8 },
        { skip: !isAdmin }
    );

    const { data: tasksData, isLoading: tasksLoading } = useGetTasksQuery({
        page: 1,
        limit: 5,
        selectedUserId: isAdmin ? undefined : user?._id,
        status: 'all',
    });

    const greeting = getGreeting();
    const firstName = user?.firstName || 'User';

    // Admin Dashboard
    if (isAdmin) {
        const summary = analyticsData?.data?.summary || { today: 0, month: 0, year: 0, total: 0 };
        const monthly: MonthlyData[] = analyticsData?.data?.monthly || [];
        const byCountry: CountryData[] = analyticsData?.data?.byCountry || [];
        const topUsers: TopUser[] = topUsersData?.data || [];

        return (
            <div className="space-y-6">
                {/* Greeting Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {greeting}, {firstName}! 👋
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Here&apos;s what&apos;s happening with your leads today.
                        </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-linear-to-br from-indigo-500 to-indigo-600 text-white border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Today&apos;s Leads</CardTitle>
                            <Calendar className="h-4 w-4 opacity-70" />
                        </CardHeader>
                        <CardContent>
                            {analyticsLoading ? (
                                <Skeleton className="h-8 w-20 bg-white/20" />
                            ) : (
                                <div className="text-3xl font-bold">{summary.today}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">This Month</CardTitle>
                            <TrendingUp className="h-4 w-4 opacity-70" />
                        </CardHeader>
                        <CardContent>
                            {analyticsLoading ? (
                                <Skeleton className="h-8 w-20 bg-white/20" />
                            ) : (
                                <div className="text-3xl font-bold">{summary.month}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-linear-to-br from-pink-500 to-pink-600 text-white border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">This Year</CardTitle>
                            <Target className="h-4 w-4 opacity-70" />
                        </CardHeader>
                        <CardContent>
                            {analyticsLoading ? (
                                <Skeleton className="h-8 w-20 bg-white/20" />
                            ) : (
                                <div className="text-3xl font-bold">{summary.year}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white border-0">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Total Leads</CardTitle>
                            <Users className="h-4 w-4 opacity-70" />
                        </CardHeader>
                        <CardContent>
                            {analyticsLoading ? (
                                <Skeleton className="h-8 w-20 bg-white/20" />
                            ) : (
                                <div className="text-3xl font-bold">{summary.total.toLocaleString()}</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Monthly Lead Trend */}
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-indigo-500 text-white">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                                Lead Trend
                            </CardTitle>
                            <CardDescription>Monthly lead generation over the last 12 months</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {analyticsLoading ? (
                                <Skeleton className="h-[280px] w-full rounded-lg" />
                            ) : monthly.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                            tickFormatter={(value) => {
                                                const [, month] = value.split('-');
                                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                return months[parseInt(month) - 1] || value;
                                            }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--accent))' }}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            labelFormatter={(value) => {
                                                const [year, month] = value.split('-');
                                                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                                return `${months[parseInt(month) - 1]} ${year}`;
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="url(#leadGradient)"
                                            radius={[6, 6, 0, 0]}
                                            name="Leads"
                                            animationDuration={1000}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[280px] flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                                        <TrendingUp className="h-8 w-8 text-indigo-500" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1">No Lead Data Yet</h3>
                                    <p className="text-muted-foreground text-sm max-w-[200px]">
                                        Start generating leads to see your trend chart here
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Performers Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-500" />
                                Top Performers
                            </CardTitle>
                            <CardDescription>Lead generation by team member</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topUsersLoading ? (
                                <Skeleton className="h-[300px] w-full" />
                            ) : topUsers.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={topUsers}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="totalCount"
                                            nameKey="userName"
                                            label={({ userName, percent }) =>
                                                `${userName?.split(' ')[0] || 'User'} (${(percent * 100).toFixed(0)}%)`
                                            }
                                        >
                                            {topUsers.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    No data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Row */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Leads by Country */}
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-500 text-white">
                                    <Globe className="h-4 w-4" />
                                </div>
                                Leads by Country
                            </CardTitle>
                            <CardDescription>Top 10 countries by lead count</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {analyticsLoading ? (
                                <Skeleton className="h-[280px] w-full rounded-lg" />
                            ) : byCountry.length > 0 ? (
                                <div className="space-y-3">
                                    {byCountry.slice(0, 8).map((item, index) => {
                                        const maxCount = byCountry[0]?.count || 1;
                                        const percentage = (item.count / maxCount) * 100;
                                        const colors = [
                                            'from-emerald-500 to-teal-500',
                                            'from-blue-500 to-indigo-500',
                                            'from-purple-500 to-pink-500',
                                            'from-orange-500 to-amber-500',
                                            'from-rose-500 to-red-500',
                                            'from-cyan-500 to-blue-500',
                                            'from-violet-500 to-purple-500',
                                            'from-lime-500 to-green-500',
                                        ];
                                        return (
                                            <div key={item.country || index} className="group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium capitalize truncate max-w-[150px]">
                                                        {item.country || 'Unknown'}
                                                    </span>
                                                    <span className="text-sm font-bold text-muted-foreground">
                                                        {item.count.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full bg-linear-to-r ${colors[index % colors.length]} rounded-full transition-all duration-500 ease-out group-hover:opacity-80`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-[280px] flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                                        <Globe className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1">No Country Data</h3>
                                    <p className="text-muted-foreground text-sm max-w-[200px]">
                                        Add leads with country information to see breakdown
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Tasks */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-orange-500" />
                                Recent Tasks
                            </CardTitle>
                            <CardDescription>Latest assigned tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tasksLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : tasksData?.data?.length > 0 ? (
                                <div className="space-y-3">
                                    {tasksData.data.slice(0, 5).map((task: { _id: string; title: string; status: string; assignedTo?: { firstName?: string; lastName?: string } }) => (
                                        <Link
                                            key={task._id}
                                            href={`/tasks/details/${task._id}`}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{task.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Assigned to: {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </Link>
                                    ))}
                                    <Link href="/tasks">
                                        <Button variant="outline" className="w-full mt-2">
                                            View All Tasks
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                    No tasks found
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Non-Admin Dashboard (Telemarketer, etc.)
    const myTasks = tasksData?.data || [];
    const pendingTasks = myTasks.filter((t: { status: string }) => t.status === 'pending').length;
    const inProgressTasks = myTasks.filter((t: { status: string }) => t.status === 'in_progress').length;
    const completedTasks = myTasks.filter((t: { status: string }) => t.status === 'completed').length;

    return (
        <div className="space-y-6">
            {/* Greeting Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {greeting}, {firstName}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    Welcome back! Here&apos;s your overview for today.
                </p>
            </div>

            {/* Task Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-linear-to-br from-amber-500 to-orange-500 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Pending Tasks</CardTitle>
                        <ClipboardList className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        {tasksLoading ? (
                            <Skeleton className="h-8 w-16 bg-white/20" />
                        ) : (
                            <div className="text-3xl font-bold">{pendingTasks}</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-blue-500 to-indigo-500 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">In Progress</CardTitle>
                        <TrendingUp className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        {tasksLoading ? (
                            <Skeleton className="h-8 w-16 bg-white/20" />
                        ) : (
                            <div className="text-3xl font-bold">{inProgressTasks}</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-emerald-500 to-green-500 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Completed</CardTitle>
                        <Target className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        {tasksLoading ? (
                            <Skeleton className="h-8 w-16 bg-white/20" />
                        ) : (
                            <div className="text-3xl font-bold">{completedTasks}</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* My Tasks */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-indigo-500" />
                        My Tasks
                    </CardTitle>
                    <CardDescription>Your assigned tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    {tasksLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-14 w-full" />
                            ))}
                        </div>
                    ) : myTasks.length > 0 ? (
                        <div className="space-y-3">
                            {myTasks.map((task: { _id: string; title: string; status: string; leads?: unknown[] }) => (
                                <Link
                                    key={task._id}
                                    href={`/tasks/details/${task._id}`}
                                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {task.leads?.length || 0} leads assigned
                                        </p>
                                    </div>
                                    <span className={`text-xs px-3 py-1.5 rounded-full capitalize font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                            task.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                        }`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </Link>
                            ))}
                            <Link href="/tasks">
                                <Button variant="outline" className="w-full mt-2">
                                    View All Tasks
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No tasks assigned to you yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Link href="/tasks">
                        <Button variant="outline" className="gap-2">
                            <ClipboardList className="h-4 w-4" />
                            View All Tasks
                        </Button>
                    </Link>
                    <Link href="/leads">
                        <Button variant="outline" className="gap-2">
                            <Users className="h-4 w-4" />
                            View Leads
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
