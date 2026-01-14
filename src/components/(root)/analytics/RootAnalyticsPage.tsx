'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    Activity,
    ChevronLeft,
    ChevronRight,
    Filter,
} from 'lucide-react';
import {
    useGetAnalyticsOverviewQuery,
    useGetLeadStatusDistributionQuery,
    useGetLeadTrendsQuery,
    useGetUserPerformanceQuery,
    useGetCountryDistributionQuery,
    useGetTodaysWorkQuery,
} from '@/redux/features/analytics/analyticsApi';
import { useGetAllUsersQuery } from '@/redux/features/user/userApi';
import { useGetGroupsQuery } from '@/redux/features/group/groupApi';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { DateRange } from 'react-day-picker';
import { useSignedUser } from '@/hooks/useSignedUser';

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

interface TodaysWorkUser {
    _id: string;
    name: string;
    role: string;
    image?: string;
    total: number;
    statusBreakdown: { status: string; count: number }[];
}

interface TodaysWorkData {
    grandTotal: number;
    users: TodaysWorkUser[];
    pagination?: {
        page: number;
        limit: number;
        totalUsers: number;
        totalPages: number;
    };
}

export default function RootAnalyticsPage() {
    const { user } = useSignedUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(
        'daily'
    );

    // Team Activity filters
    const [activityUserFilter, setActivityUserFilter] = useState<string>('all');
    const [activityStatusFilter, setActivityStatusFilter] =
        useState<string>('all');
    const [activityGroupFilter, setActivityGroupFilter] =
        useState<string>('all');
    const [activityPage, setActivityPage] = useState(1);
    const activityLimit = 10;

    const queryParams = {
        startDate: dateRange?.from
            ? format(dateRange.from, 'yyyy-MM-dd')
            : undefined,
        endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    };

    const { data: overviewData, isLoading: overviewLoading } =
        useGetAnalyticsOverviewQuery(queryParams);
    const { data: statusData, isLoading: statusLoading } =
        useGetLeadStatusDistributionQuery(queryParams);
    const { data: trendsData, isLoading: trendsLoading } =
        useGetLeadTrendsQuery({ ...queryParams, period });
    const { data: userPerformanceData, isLoading: userPerformanceLoading } =
        useGetUserPerformanceQuery({ ...queryParams, limit: 8 });
    const { data: countryData, isLoading: countryLoading } =
        useGetCountryDistributionQuery({ ...queryParams, limit: 8 });

    // Team Activity query with filters
    const { data: todaysWorkData, isLoading: todaysWorkLoading } =
        useGetTodaysWorkQuery({
            ...queryParams,
            userId:
                activityUserFilter !== 'all' ? activityUserFilter : undefined,
            status:
                activityStatusFilter !== 'all'
                    ? activityStatusFilter
                    : undefined,
            groupId:
                activityGroupFilter !== 'all' ? activityGroupFilter : undefined,
            page: activityPage,
            limit: activityLimit,
        });

    // Get users and groups for filter dropdowns
    const { data: usersData } = useGetAllUsersQuery({});
    const { data: groupsData } = useGetGroupsQuery({});

    const overview = overviewData?.data;
    const statusDistribution: StatusDistributionItem[] = statusData?.data || [];
    const trends = trendsData?.data || [];
    const userPerformance: UserPerformanceItem[] =
        userPerformanceData?.data || [];
    const countries: CountryItem[] = countryData?.data || [];
    const todaysWork: TodaysWorkData | null = todaysWorkData?.data || null;
    const allUsers = usersData?.users || [];
    const allGroups = groupsData?.data || [];

    const getStatusCount = (
        breakdown: { status: string; count: number }[],
        status: string
    ) => {
        return breakdown.find((s) => s.status === status)?.count || 0;
    };

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
                                            {format(
                                                dateRange.to,
                                                'LLL dd, yyyy'
                                            )}
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
                        <CardTitle className="text-sm font-medium opacity-90">
                            Total Leads
                        </CardTitle>
                        <Users className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        {overviewLoading ? (
                            <Skeleton className="h-8 w-20 bg-white/20" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold">
                                    {(
                                        overview?.totalLeads || 0
                                    ).toLocaleString()}
                                </div>
                                {overview?.newLeadsToday > 0 && (
                                    <p className="text-xs opacity-80 mt-1">
                                        +{overview.newLeadsToday} today
                                    </p>
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
                        {isAdmin ? (
                            <ClipboardList className="h-4 w-4 opacity-70" />
                        ) : (
                            <Target className="h-4 w-4 opacity-70" />
                        )}
                    </CardHeader>
                    <CardContent>
                        {overviewLoading ? (
                            <Skeleton className="h-8 w-20 bg-white/20" />
                        ) : (
                            <div className="text-3xl font-bold">
                                {isAdmin
                                    ? overview?.activeTasks || 0
                                    : overview?.interestedLeads || 0}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-pink-500 to-pink-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            {isAdmin ? 'Active Users' : 'On Board'}
                        </CardTitle>
                        {isAdmin ? (
                            <UserCheck className="h-4 w-4 opacity-70" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 opacity-70" />
                        )}
                    </CardHeader>
                    <CardContent>
                        {overviewLoading ? (
                            <Skeleton className="h-8 w-20 bg-white/20" />
                        ) : (
                            <div className="text-3xl font-bold">
                                {isAdmin
                                    ? overview?.activeUsers || 0
                                    : overview?.onBoardLeads || 0}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            Conversion Rate
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        {overviewLoading ? (
                            <Skeleton className="h-8 w-20 bg-white/20" />
                        ) : (
                            <div className="text-3xl font-bold">
                                {overview?.conversionRate || 0}%
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Team Activity Section - Today's/Date Range Work */}
            {isAdmin && (
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle>Team Activity</CardTitle>
                                        <CardDescription>
                                            Lead updates by team members (
                                            {dateRange?.from && dateRange?.to
                                                ? `${format(
                                                      dateRange.from,
                                                      'MMM dd'
                                                  )} - ${format(
                                                      dateRange.to,
                                                      'MMM dd, yyyy'
                                                  )}`
                                                : 'Today'}
                                            )
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="text-lg px-4 py-1"
                                >
                                    {todaysWork?.grandTotal || 0} Total
                                </Badge>
                            </div>

                            {/* Filters Row */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Filter className="h-4 w-4" />
                                    <span>Filters:</span>
                                </div>

                                {/* User Filter */}
                                <Select
                                    value={activityUserFilter}
                                    onValueChange={(v) => {
                                        setActivityUserFilter(v);
                                        setActivityPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[160px] h-9">
                                        <SelectValue placeholder="All Users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Users
                                        </SelectItem>
                                        {allUsers.map(
                                            (u: {
                                                _id: string;
                                                firstName: string;
                                                lastName?: string;
                                            }) => (
                                                <SelectItem
                                                    key={u._id}
                                                    value={u._id}
                                                >
                                                    {u.firstName}{' '}
                                                    {u.lastName || ''}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>

                                {/* Status Filter */}
                                <Select
                                    value={activityStatusFilter}
                                    onValueChange={(v) => {
                                        setActivityStatusFilter(v);
                                        setActivityPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[140px] h-9">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="interested">
                                            Interested
                                        </SelectItem>
                                        <SelectItem value="not-interested">
                                            Not Interested
                                        </SelectItem>
                                        <SelectItem value="call-back">
                                            Call Back
                                        </SelectItem>
                                        <SelectItem value="test-trial">
                                            Test Trial
                                        </SelectItem>
                                        <SelectItem value="on-board">
                                            On Board
                                        </SelectItem>
                                        <SelectItem value="answering-machine">
                                            Answering Machine
                                        </SelectItem>
                                        <SelectItem value="language-barrier">
                                            Language Barrier
                                        </SelectItem>
                                        <SelectItem value="invalid-number">
                                            Invalid Number
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Group Filter */}
                                <Select
                                    value={activityGroupFilter}
                                    onValueChange={(v) => {
                                        setActivityGroupFilter(v);
                                        setActivityPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[140px] h-9">
                                        <SelectValue placeholder="All Groups" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Groups
                                        </SelectItem>
                                        {allGroups.map(
                                            (g: {
                                                _id: string;
                                                name: string;
                                            }) => (
                                                <SelectItem
                                                    key={g._id}
                                                    value={g._id}
                                                >
                                                    {g.name}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>

                                {/* Clear Filters */}
                                {(activityUserFilter !== 'all' ||
                                    activityStatusFilter !== 'all' ||
                                    activityGroupFilter !== 'all') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setActivityUserFilter('all');
                                            setActivityStatusFilter('all');
                                            setActivityGroupFilter('all');
                                            setActivityPage(1);
                                        }}
                                        className="h-9 text-muted-foreground hover:text-foreground"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {todaysWorkLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : todaysWork && todaysWork.users.length > 0 ? (
                            <>
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="font-semibold">
                                                    Team Member
                                                </TableHead>
                                                <TableHead className="text-center font-semibold">
                                                    Total
                                                </TableHead>
                                                <TableHead className="text-center font-semibold text-blue-600">
                                                    New
                                                </TableHead>
                                                <TableHead className="text-center font-semibold text-green-600">
                                                    Interested
                                                </TableHead>
                                                <TableHead className="text-center font-semibold text-yellow-600">
                                                    Call Back
                                                </TableHead>
                                                <TableHead className="text-center font-semibold text-purple-600">
                                                    Test Trial
                                                </TableHead>
                                                <TableHead className="text-center font-semibold text-emerald-600">
                                                    On Board
                                                </TableHead>
                                                <TableHead className="text-center font-semibold text-red-600">
                                                    Not Int.
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {todaysWork.users.map((actUser) => (
                                                <TableRow
                                                    key={actUser._id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage
                                                                    src={
                                                                        actUser.image
                                                                    }
                                                                />
                                                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                                    {actUser.name
                                                                        ?.split(
                                                                            ' '
                                                                        )
                                                                        .map(
                                                                            (
                                                                                n: string
                                                                            ) =>
                                                                                n[0]
                                                                        )
                                                                        .join(
                                                                            ''
                                                                        )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {
                                                                        actUser.name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground capitalize">
                                                                    {
                                                                        actUser.role
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className="bg-indigo-500 hover:bg-indigo-600">
                                                            {actUser.total}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getStatusCount(
                                                            actUser.statusBreakdown,
                                                            'new'
                                                        ) > 0 && (
                                                            <span className="text-blue-600 font-medium">
                                                                {getStatusCount(
                                                                    actUser.statusBreakdown,
                                                                    'new'
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getStatusCount(
                                                            actUser.statusBreakdown,
                                                            'interested'
                                                        ) > 0 && (
                                                            <span className="text-green-600 font-medium">
                                                                {getStatusCount(
                                                                    actUser.statusBreakdown,
                                                                    'interested'
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getStatusCount(
                                                            actUser.statusBreakdown,
                                                            'call-back'
                                                        ) > 0 && (
                                                            <span className="text-yellow-600 font-medium">
                                                                {getStatusCount(
                                                                    actUser.statusBreakdown,
                                                                    'call-back'
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getStatusCount(
                                                            actUser.statusBreakdown,
                                                            'test-trial'
                                                        ) > 0 && (
                                                            <span className="text-purple-600 font-medium">
                                                                {getStatusCount(
                                                                    actUser.statusBreakdown,
                                                                    'test-trial'
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getStatusCount(
                                                            actUser.statusBreakdown,
                                                            'on-board'
                                                        ) > 0 && (
                                                            <span className="text-emerald-600 font-medium">
                                                                {getStatusCount(
                                                                    actUser.statusBreakdown,
                                                                    'on-board'
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getStatusCount(
                                                            actUser.statusBreakdown,
                                                            'not-interested'
                                                        ) > 0 && (
                                                            <span className="text-red-600 font-medium">
                                                                {getStatusCount(
                                                                    actUser.statusBreakdown,
                                                                    'not-interested'
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {todaysWork.pagination &&
                                    todaysWork.pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <div className="text-sm text-muted-foreground">
                                                Showing{' '}
                                                {(todaysWork.pagination.page -
                                                    1) *
                                                    todaysWork.pagination
                                                        .limit +
                                                    1}{' '}
                                                -{' '}
                                                {Math.min(
                                                    todaysWork.pagination.page *
                                                        todaysWork.pagination
                                                            .limit,
                                                    todaysWork.pagination
                                                        .totalUsers
                                                )}{' '}
                                                of{' '}
                                                {
                                                    todaysWork.pagination
                                                        .totalUsers
                                                }{' '}
                                                users
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setActivityPage((p) =>
                                                            Math.max(1, p - 1)
                                                        )
                                                    }
                                                    disabled={activityPage <= 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Previous
                                                </Button>
                                                <div className="flex items-center gap-1 px-2">
                                                    <span className="text-sm font-medium">
                                                        {activityPage}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        /
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {
                                                            todaysWork
                                                                .pagination
                                                                .totalPages
                                                        }
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setActivityPage((p) =>
                                                            Math.min(
                                                                todaysWork
                                                                    .pagination
                                                                    ?.totalPages ||
                                                                    1,
                                                                p + 1
                                                            )
                                                        )
                                                    }
                                                    disabled={
                                                        activityPage >=
                                                        (todaysWork.pagination
                                                            ?.totalPages || 1)
                                                    }
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                            </>
                        ) : (
                            <div className="h-[150px] flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                                    <Activity className="h-6 w-6 text-orange-500" />
                                </div>
                                <h3 className="font-semibold mb-1">
                                    No Activity Yet
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    No lead updates in the selected date range
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

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
                            <Select
                                value={period}
                                onValueChange={(
                                    v: 'daily' | 'weekly' | 'monthly'
                                ) => setPeriod(v)}
                            >
                                <SelectTrigger className="w-[100px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">
                                        Weekly
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                        Monthly
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <CardDescription>
                            Lead generation over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {trendsLoading ? (
                            <Skeleton className="h-[280px] w-full rounded-lg" />
                        ) : trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart
                                    data={trends}
                                    margin={{
                                        top: 20,
                                        right: 20,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="trendsGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#6366f1"
                                                stopOpacity={0.4}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#6366f1"
                                                stopOpacity={0.05}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="hsl(var(--border))"
                                        strokeOpacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'hsl(var(--muted-foreground))',
                                        }}
                                        tickFormatter={(value) => {
                                            if (period === 'daily') {
                                                const parts = value.split('-');
                                                return `${parts[1]}/${parts[2]}`;
                                            }
                                            return value;
                                        }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'hsl(var(--muted-foreground))',
                                        }}
                                        width={45}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor:
                                                'hsl(var(--popover))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '10px',
                                            boxShadow:
                                                '0 8px 32px rgba(0,0,0,0.12)',
                                            padding: '12px 16px',
                                        }}
                                        labelStyle={{
                                            fontWeight: 600,
                                            marginBottom: 4,
                                        }}
                                        itemStyle={{ color: '#6366f1' }}
                                        formatter={(value: number) => [
                                            value.toLocaleString(),
                                            'Leads',
                                        ]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="leads"
                                        stroke="#6366f1"
                                        strokeWidth={2.5}
                                        fill="url(#trendsGradient)"
                                        name="Leads"
                                        animationDuration={1000}
                                        dot={{
                                            fill: '#6366f1',
                                            strokeWidth: 0,
                                            r: 4,
                                        }}
                                        activeDot={{
                                            fill: '#6366f1',
                                            strokeWidth: 2,
                                            stroke: '#fff',
                                            r: 6,
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                                    <TrendingUp className="h-8 w-8 text-indigo-500" />
                                </div>
                                <h3 className="font-semibold text-lg mb-1">
                                    No Data Yet
                                </h3>
                                <p className="text-muted-foreground text-sm max-w-[200px]">
                                    Start generating leads to see your trend
                                    chart here
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Distribution - Enhanced Design */}
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 text-white">
                                <Users className="h-4 w-4" />
                            </div>
                            Lead Status Distribution
                        </CardTitle>
                        <CardDescription>Breakdown by status</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {statusLoading ? (
                            <div className="space-y-4">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-10 w-full rounded-lg"
                                    />
                                ))}
                            </div>
                        ) : statusDistribution.length > 0 ? (
                            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                {(() => {
                                    const sortedData = [
                                        ...statusDistribution,
                                    ].sort((a, b) => b.value - a.value);
                                    const maxValue = sortedData[0]?.value || 1;
                                    const total = sortedData.reduce(
                                        (sum, s) => sum + s.value,
                                        0
                                    );

                                    // Status colors with solid colors for better visibility
                                    const statusColors: Record<
                                        string,
                                        {
                                            bg: string;
                                            text: string;
                                            dot: string;
                                        }
                                    > = {
                                        new: {
                                            bg: 'bg-blue-500',
                                            text: 'text-blue-600',
                                            dot: 'bg-blue-500',
                                        },
                                        interested: {
                                            bg: 'bg-emerald-500',
                                            text: 'text-emerald-600',
                                            dot: 'bg-emerald-500',
                                        },
                                        'not-interested': {
                                            bg: 'bg-rose-500',
                                            text: 'text-rose-600',
                                            dot: 'bg-rose-500',
                                        },
                                        'call-back': {
                                            bg: 'bg-amber-500',
                                            text: 'text-amber-600',
                                            dot: 'bg-amber-500',
                                        },
                                        'test-trial': {
                                            bg: 'bg-violet-500',
                                            text: 'text-violet-600',
                                            dot: 'bg-violet-500',
                                        },
                                        'on-board': {
                                            bg: 'bg-green-600',
                                            text: 'text-green-600',
                                            dot: 'bg-green-600',
                                        },
                                        'answering-machine': {
                                            bg: 'bg-slate-500',
                                            text: 'text-slate-600',
                                            dot: 'bg-slate-500',
                                        },
                                        'language-barrier': {
                                            bg: 'bg-orange-500',
                                            text: 'text-orange-600',
                                            dot: 'bg-orange-500',
                                        },
                                        'invalid-number': {
                                            bg: 'bg-red-600',
                                            text: 'text-red-600',
                                            dot: 'bg-red-600',
                                        },
                                        'email/whatsapp-sent': {
                                            bg: 'bg-cyan-500',
                                            text: 'text-cyan-600',
                                            dot: 'bg-cyan-500',
                                        },
                                        'no-answer': {
                                            bg: 'bg-gray-400',
                                            text: 'text-gray-600',
                                            dot: 'bg-gray-400',
                                        },
                                        busy: {
                                            bg: 'bg-yellow-500',
                                            text: 'text-yellow-600',
                                            dot: 'bg-yellow-500',
                                        },
                                    };

                                    return sortedData.map((item, index) => {
                                        const percentage =
                                            (item.value / maxValue) * 100;
                                        const percentOfTotal = (
                                            (item.value / total) *
                                            100
                                        ).toFixed(1);
                                        const colors = statusColors[
                                            item.name
                                        ] || {
                                            bg: 'bg-indigo-500',
                                            text: 'text-indigo-600',
                                            dot: 'bg-indigo-500',
                                        };

                                        return (
                                            <div
                                                key={item.name || index}
                                                className="group"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    {/* Status dot indicator */}
                                                    <div
                                                        className={`w-2.5 h-2.5 rounded-full ${colors.dot} shrink-0`}
                                                    />

                                                    {/* Status name */}
                                                    <span className="text-sm font-medium capitalize flex-1 truncate">
                                                        {item.name
                                                            ?.replace(/-/g, ' ')
                                                            .replace(
                                                                /\//g,
                                                                ' / '
                                                            )}
                                                    </span>

                                                    {/* Percentage badge */}
                                                    <span
                                                        className={`text-xs font-semibold ${colors.text} bg-muted px-2 py-0.5 rounded-md`}
                                                    >
                                                        {percentOfTotal}%
                                                    </span>

                                                    {/* Count */}
                                                    <span className="text-sm font-bold tabular-nums min-w-[52px] text-right">
                                                        {item.value.toLocaleString()}
                                                    </span>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="h-2.5 bg-muted/60 rounded-lg overflow-hidden ml-5">
                                                    <div
                                                        className={`h-full ${colors.bg} rounded-lg transition-all duration-700 ease-out group-hover:brightness-110`}
                                                        style={{
                                                            width: `${Math.max(
                                                                percentage,
                                                                1
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        ) : (
                            <div className="h-[280px] flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                                    <Users className="h-7 w-7 text-purple-500" />
                                </div>
                                <h3 className="font-semibold mb-1">
                                    No Data Available
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    Status distribution will appear here
                                </p>
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
                        <CardDescription>
                            Top countries by lead count
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {countryLoading ? (
                            <Skeleton className="h-[280px] w-full rounded-lg" />
                        ) : countries.length > 0 ? (
                            <div className="space-y-3">
                                {countries.map((item, index) => {
                                    const maxCount = countries[0]?.count || 1;
                                    const percentage =
                                        (item.count / maxCount) * 100;
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
                                        <div
                                            key={item.country || index}
                                            className="group"
                                        >
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
                                                    className={`h-full bg-linear-to-r ${
                                                        colors[
                                                            index %
                                                                colors.length
                                                        ]
                                                    } rounded-full transition-all duration-500 ease-out group-hover:opacity-80`}
                                                    style={{
                                                        width: `${percentage}%`,
                                                    }}
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
                                <h3 className="font-semibold text-lg mb-1">
                                    No Country Data
                                </h3>
                                <p className="text-muted-foreground text-sm max-w-[200px]">
                                    Add leads with country information to see
                                    breakdown
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
                        <CardDescription>
                            Users with highest lead generation
                        </CardDescription>
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
                                                    {user.name
                                                        ?.split(' ')
                                                        .map(
                                                            (n: string) => n[0]
                                                        )
                                                        .join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {user.role}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="bg-green-50 text-green-700 border-green-200"
                                            >
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
