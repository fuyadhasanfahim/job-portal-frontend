'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    Users,
    TrendingUp,
    CheckCircle2,
    Target,
    Calendar as CalendarIcon,
    ClipboardList,
    UserCheck,
    Globe,
} from 'lucide-react';
import {
    useGetAnalyticsOverviewQuery,
    useGetLeadStatusDistributionQuery,
    useGetLeadTrendsQuery,
    useGetUserPerformanceQuery,
    useGetCountryDistributionQuery,
} from '@/redux/features/analytics/analyticsApi';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
} from 'recharts';
import { DateRange } from 'react-day-picker';
import { useSignedUser } from '@/hooks/useSignedUser';

// Chart colors matching dashboard theme
const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#14b8a6'];

// Analytics data types
interface StatusDistributionItem {
    name: string;
    value: number;
    color?: string;
}

interface CountryItem {
    country: string;
    count: number;
}

interface UserPerformanceItem {
    _id: string;
    name: string;
    role: string;
    image?: string;
    totalLeads: number;
    interested: number;
}

export default function RootAnalyticsPage() {
    const { user } = useSignedUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const queryParams = {
        startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    };

    const { data: overviewData, isLoading: overviewLoading } = useGetAnalyticsOverviewQuery(queryParams);
    const { data: statusData, isLoading: statusLoading } = useGetLeadStatusDistributionQuery(queryParams);
    const { data: trendsData, isLoading: trendsLoading } = useGetLeadTrendsQuery({ ...queryParams, period });
    const { data: userPerformanceData, isLoading: userPerformanceLoading } = useGetUserPerformanceQuery({ ...queryParams, limit: 8 });
    const { data: countryData, isLoading: countryLoading } = useGetCountryDistributionQuery({ ...queryParams, limit: 8 });

    const overview = overviewData?.data;
    const statusDistribution: StatusDistributionItem[] = statusData?.data || [];
    const trends = trendsData?.data || [];
    const userPerformance: UserPerformanceItem[] = userPerformanceData?.data || [];
    const countries: CountryItem[] = countryData?.data || [];

    return (
        <div className="space-y-6">
            {/* Header - matching Dashboard style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Analytics Dashboard 📊
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor your lead generation and team performance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'justify-start text-left font-normal min-w-[240px]',
                                    !dateRange && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, 'LLL dd')} -{' '}
                                            {format(dateRange.to, 'LLL dd, yyyy')}
                                        </>
                                    ) : (
                                        format(dateRange.from, 'LLL dd, yyyy')
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* KPI Cards - matching Dashboard gradient style */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-linear-to-br from-indigo-500 to-indigo-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Total Leads</CardTitle>
                        <Users className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        {overviewLoading ? (
                            <Skeleton className="h-8 w-20 bg-white/20" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold">{(overview?.totalLeads || 0).toLocaleString()}</div>
                                {overview?.newLeadsToday > 0 && (
                                    <p className="text-xs opacity-80 mt-1">+{overview.newLeadsToday} today</p>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            {isAdmin ? 'Active Tasks' : 'Interested'}
                        </CardTitle>
                        {isAdmin ? <ClipboardList className="h-4 w-4 opacity-70" /> : <Target className="h-4 w-4 opacity-70" />}
                    </CardHeader>
                    <CardContent>
                        {overviewLoading ? (
                            <Skeleton className="h-8 w-20 bg-white/20" />
                        ) : (
                            <div className="text-3xl font-bold">
                                {isAdmin ? (overview?.activeTasks || 0) : (overview?.interestedLeads || 0)}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-pink-500 to-pink-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            {isAdmin ? 'Active Users' : 'On Board'}
                        </CardTitle>
                        {isAdmin ? <UserCheck className="h-4 w-4 opacity-70" /> : <CheckCircle2 className="h-4 w-4 opacity-70" />}
                    </CardHeader>
                    <CardContent>
                        {overviewLoading ? (
                            <Skeleton className="h-8 w-20 bg-white/20" />
                        ) : (
                            <div className="text-3xl font-bold">
                                {isAdmin ? (overview?.activeUsers || 0) : (overview?.onBoardLeads || 0)}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        {overviewLoading ? (
                            <Skeleton className="h-8 w-20 bg-white/20" />
                        ) : (
                            <div className="text-3xl font-bold">{overview?.conversionRate || 0}%</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Lead Trends Chart */}
                <Card className="overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-indigo-500 text-white">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                                Lead Trends
                            </CardTitle>
                            <Select value={period} onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setPeriod(v)}>
                                <SelectTrigger className="w-[100px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <CardDescription>Lead generation over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {trendsLoading ? (
                            <Skeleton className="h-[280px] w-full rounded-lg" />
                        ) : trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        tickFormatter={(value) => {
                                            if (period === 'daily') {
                                                const parts = value.split('-');
                                                return `${parts[1]}/${parts[2]}`;
                                            }
                                            return value;
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
                                    />
                                    <Bar
                                        dataKey="leads"
                                        fill="url(#analyticsGradient)"
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
                                <h3 className="font-semibold text-lg mb-1">No Data Yet</h3>
                                <p className="text-muted-foreground text-sm max-w-[200px]">
                                    Start generating leads to see your trend chart here
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Distribution Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            Lead Status Distribution
                        </CardTitle>
                        <CardDescription>Breakdown by status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statusLoading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : statusDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }) =>
                                            `${name?.replace('-', ' ')} (${(percent * 100).toFixed(0)}%)`
                                        }
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
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
                {/* Countries */}
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-500 text-white">
                                <Globe className="h-4 w-4" />
                            </div>
                            Leads by Country
                        </CardTitle>
                        <CardDescription>Top countries by lead count</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {countryLoading ? (
                            <Skeleton className="h-[280px] w-full rounded-lg" />
                        ) : countries.length > 0 ? (
                            <div className="space-y-3">
                                {countries.map((item, index) => {
                                    const maxCount = countries[0]?.count || 1;
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

                {/* Top Performers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            Top Performers
                        </CardTitle>
                        <CardDescription>Users with highest lead generation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {userPerformanceLoading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : userPerformance.length > 0 ? (
                            <div className="space-y-3">
                                {userPerformance.slice(0, 5).map((user) => (
                                    <div 
                                        key={user._id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.image} />
                                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                    {user.name?.split(' ').map((n: string) => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{user.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                {user.interested} interested
                                            </Badge>
                                            <Badge className="bg-indigo-500">
                                                {user.totalLeads} total
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
