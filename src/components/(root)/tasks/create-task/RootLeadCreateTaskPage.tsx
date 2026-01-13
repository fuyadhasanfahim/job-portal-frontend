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
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import {
    ChevronDownIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Users,
    ClipboardList,
    RotateCcw,
    CheckSquare,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCountriesQuery } from '@/redux/features/country/countryApi';
import { useGetLeadsForTaskQuery } from '@/redux/features/lead/leadApi';
import {
    useCreateTaskMutation,
    useGetTasksQuery,
} from '@/redux/features/task/taskApi';
import { useSignedUser } from '@/hooks/useSignedUser';
import { ILead } from '@/types/lead.interface';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useGetGroupsQuery } from '@/redux/features/group/groupApi';

type SortOption = 'companyAsc' | 'companyDesc' | 'countryAsc' | 'countryDesc';

const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'answering-machine', label: 'Answering Machine' },
    { value: 'interested', label: 'Interested' },
    { value: 'not-interested', label: 'Not Interested' },
    { value: 'test-trial', label: 'Test Trial' },
    { value: 'call-back', label: 'Call Back' },
    { value: 'on-board', label: 'On Board' },
    { value: 'invalid-number', label: 'Invalid Number' },
];

const contactTypeTabs = [
    { value: 'all', label: 'All Leads' },
    { value: 'email-with-phone', label: 'Email + Phone' },
    { value: 'email-only', label: 'Email Only' },
    { value: 'phone-only', label: 'Phone Only' },
];

export default function RootLeadCreateTaskPage() {
    const { user } = useSignedUser();

    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [countryFilter, setCountryFilter] = useState('all');
    const [status, setStatus] = useState('all');
    const [sort, setSort] = useState<SortOption>('companyAsc');
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');
    const [contactFilter, setContactFilter] = useState<
        'all' | 'email-only' | 'phone-only' | 'email-with-phone'
    >('all');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: countries } = useGetCountriesQuery({});
    const { data: groupsData } = useGetGroupsQuery({});
    const groups = groupsData?.groups ?? [];

    const {
        data,
        isLoading: leadsLoading,
        isFetching,
    } = useGetLeadsForTaskQuery({
        page,
        limit: perPage,
        country: countryFilter,
        sortBy: sort.includes('company') ? 'company.name' : 'country',
        sortOrder: sort.endsWith('Asc') ? 'asc' : 'desc',
        status,
        search: debouncedSearch,
        group: groupFilter,
        contactFilter,
    });

    const leads = data?.data ?? [];
    const pagination = data?.pagination ?? { totalItems: 0, totalPages: 1 };
    const [createTask, { isLoading: creating }] = useCreateTaskMutation();

    // Check for incomplete (in-progress) tasks
    const { data: tasksData } = useGetTasksQuery({
        page: 1,
        limit: 10,
        status: 'in-progress',
    });
    const hasIncompleteTasks = (tasksData?.tasks?.length ?? 0) > 0;
    const incompleteTaskCount = tasksData?.tasks?.length ?? 0;

    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedLeads(leads.map((lead: ILead) => lead._id));
        else setSelectedLeads([]);
    };

    const handleToggleLead = (id: string) => {
        setSelectedLeads((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleCreateTask = async () => {
        if (!user?._id) {
            return toast.error('Please login to create a task');
        }
        if (selectedLeads.length === 0) {
            return toast.error('Please select at least one lead');
        }

        try {
            const res = await createTask({
                title: `Lead Assignment - ${new Date().toLocaleDateString()}`,
                description: `Lead generation task`,
                type: 'cold_call',
                quantity: selectedLeads.length,
                assignedTo: user._id,
                leads: selectedLeads,
            }).unwrap();

            toast.success(res.message || 'Task created successfully!');
            setSelectedLeads([]);
        } catch (err) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ??
                'Failed to create task';
            toast.error(message);
        }
    };

    const resetFilters = () => {
        setStatus('all');
        setCountryFilter('all');
        setGroupFilter('all');
        setContactFilter('all');
        setDate(undefined);
        setSearchTerm('');
        setPage(1);
    };

    const hasActiveFilters =
        status !== 'all' ||
        countryFilter !== 'all' ||
        groupFilter !== 'all' ||
        contactFilter !== 'all' ||
        date ||
        searchTerm;

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle>Create Lead Task</CardTitle>
                    </div>

                    {selectedLeads.length > 0 && (
                        <div className="flex items-center gap-3">
                            <Badge
                                variant="secondary"
                                className="gap-1.5 px-3 py-1.5"
                            >
                                <CheckSquare className="h-3.5 w-3.5" />
                                {selectedLeads.length} leads selected
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLeads([])}
                            >
                                Clear
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Warning for incomplete tasks */}
                {hasIncompleteTasks && (
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800">
                        <div className="p-1.5 rounded-full bg-yellow-200/50 shrink-0">
                            <ClipboardList className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">
                                আপনার {incompleteTaskCount}টি incomplete task
                                আছে
                            </p>
                            <p className="text-xs text-yellow-700 mt-0.5">
                                নতুন task তৈরি করার আগে পুরাতন task গুলো
                                complete করুন।
                            </p>
                        </div>
                    </div>
                )}
                {/* Contact Type Tabs */}
                <Tabs
                    value={contactFilter}
                    onValueChange={(val) => {
                        setContactFilter(
                            val as
                                | 'all'
                                | 'email-only'
                                | 'phone-only'
                                | 'email-with-phone'
                        );
                        setPage(1);
                    }}
                    className="w-full"
                >
                    <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-primary/10 w-full justify-start">
                        {contactTypeTabs.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="text-xs"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Status Tabs */}
                <Tabs
                    value={status}
                    onValueChange={(val) => {
                        setStatus(val);
                        setPage(1);
                    }}
                    className="w-full"
                >
                    <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50 w-full justify-start">
                        {statusTabs.map((s) => (
                            <TabsTrigger
                                key={s.value}
                                value={s.value}
                                className="capitalize text-xs"
                            >
                                {s.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Search Row */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Country */}
                    <Select
                        value={countryFilter}
                        onValueChange={setCountryFilter}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            {countries?.map((c) => (
                                <SelectItem
                                    key={c.name}
                                    value={c.name}
                                    className="capitalize"
                                >
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Group */}
                    <Select value={groupFilter} onValueChange={setGroupFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Groups</SelectItem>
                            {groups.map(
                                (g: {
                                    _id: string;
                                    name: string;
                                    color?: string;
                                }) => (
                                    <SelectItem key={g._id} value={g._id}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        g.color || '#6366f1',
                                                }}
                                            />
                                            {g.name}
                                        </div>
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>

                    {/* Date */}
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-[140px] justify-between font-normal',
                                    date && 'text-foreground'
                                )}
                            >
                                {date
                                    ? date.toLocaleDateString()
                                    : 'Select date'}
                                <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                captionLayout="dropdown"
                                onSelect={(d) => {
                                    setDate(d);
                                    setOpen(false);
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Sort */}
                    <Select
                        value={sort}
                        onValueChange={(val) => setSort(val as SortOption)}
                    >
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="companyAsc">
                                Company A-Z
                            </SelectItem>
                            <SelectItem value="companyDesc">
                                Company Z-A
                            </SelectItem>
                            <SelectItem value="countryAsc">
                                Country A-Z
                            </SelectItem>
                            <SelectItem value="countryDesc">
                                Country Z-A
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Per Page */}
                    <Select
                        value={String(perPage)}
                        onValueChange={(val) => setPerPage(Number(val))}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n} / page
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Reset */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="gap-1.5"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={
                                            selectedLeads.length ===
                                                leads.length && leads.length > 0
                                        }
                                        onCheckedChange={(checked) =>
                                            handleSelectAll(!!checked)
                                        }
                                    />
                                </TableHead>
                                <TableHead className="text-xs font-semibold min-w-[150px]">
                                    Company
                                </TableHead>
                                <TableHead className="text-xs font-semibold min-w-[140px]">
                                    Website
                                </TableHead>
                                <TableHead className="text-xs font-semibold min-w-[130px]">
                                    Contact
                                </TableHead>
                                <TableHead className="text-xs font-semibold min-w-[180px]">
                                    Email
                                </TableHead>
                                <TableHead className="text-xs font-semibold min-w-[120px]">
                                    Phone
                                </TableHead>
                                <TableHead className="text-xs font-semibold min-w-[100px]">
                                    Country
                                </TableHead>
                                <TableHead className="text-xs font-semibold min-w-[100px]">
                                    Status
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {leadsLoading || isFetching ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                        {Array.from({ length: 8 }).map(
                                            (__, j) => (
                                                <TableCell
                                                    key={j}
                                                    className="py-3"
                                                >
                                                    <Skeleton className="h-4 w-full max-w-[100px] rounded-full" />
                                                </TableCell>
                                            )
                                        )}
                                    </TableRow>
                                ))
                            ) : leads.length ? (
                                leads.map((lead: ILead) => (
                                    <TableRow
                                        key={lead._id}
                                        className={cn(
                                            'hover:bg-muted/50 transition-colors cursor-pointer',
                                            selectedLeads.includes(lead._id) &&
                                                'bg-primary/5'
                                        )}
                                        onClick={() =>
                                            handleToggleLead(lead._id)
                                        }
                                    >
                                        <TableCell
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                checked={selectedLeads.includes(
                                                    lead._id
                                                )}
                                                onCheckedChange={() =>
                                                    handleToggleLead(lead._id)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-sm truncate max-w-[150px]">
                                            {lead.company.name}
                                        </TableCell>
                                        <TableCell className="text-sm truncate max-w-[140px]">
                                            {lead.company.website ? (
                                                <Link
                                                    href={
                                                        lead.company.website.startsWith(
                                                            'http'
                                                        )
                                                            ? lead.company
                                                                  .website
                                                            : `https://${lead.company.website}`
                                                    }
                                                    target="_blank"
                                                    className="text-blue-600 hover:underline"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {lead.company.website}
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm truncate max-w-[130px] capitalize">
                                            {lead.contactPersons[0]?.firstName}{' '}
                                            {lead.contactPersons[0]?.lastName}
                                        </TableCell>
                                        <TableCell className="text-sm truncate max-w-[180px]">
                                            {lead.contactPersons[0]
                                                ?.emails?.[0] || (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm truncate max-w-[120px]">
                                            {lead.contactPersons[0]
                                                ?.phones?.[0] || (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm truncate max-w-[100px]">
                                            {lead.country || (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'capitalize text-xs',
                                                    lead.status === 'new' &&
                                                        'bg-blue-50 text-blue-700 border-blue-200',
                                                    lead.status ===
                                                        'interested' &&
                                                        'bg-green-50 text-green-700 border-green-200',
                                                    lead.status ===
                                                        'not-interested' &&
                                                        'bg-red-50 text-red-700 border-red-200',
                                                    lead.status ===
                                                        'call-back' &&
                                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                )}
                                            >
                                                {lead.status.replace('-', ' ')}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-center py-16 text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-muted-foreground/50" />
                                            <p>No leads found</p>
                                            {hasActiveFilters && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={resetFilters}
                                                >
                                                    Clear filters
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                    <div className="text-sm text-muted-foreground">
                        {pagination.totalItems > 0 ? (
                            <>
                                Showing{' '}
                                <span className="font-medium text-foreground">
                                    {(page - 1) * perPage + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium text-foreground">
                                    {Math.min(
                                        page * perPage,
                                        pagination.totalItems
                                    )}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-foreground">
                                    {pagination.totalItems}
                                </span>{' '}
                                leads
                            </>
                        ) : (
                            'No leads to display'
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <span className="text-sm text-muted-foreground mx-2">
                            Page <span className="font-medium">{page}</span> of{' '}
                            <span className="font-medium">
                                {pagination.totalPages || 1}
                            </span>
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={
                                page === pagination.totalPages ||
                                pagination.totalPages === 0
                            }
                            onClick={() => setPage((p) => p + 1)}
                            className="gap-1"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Floating Action Bar */}
            {selectedLeads.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-4 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5" />
                            <span className="font-medium">
                                {selectedLeads.length} lead
                                {selectedLeads.length > 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <div className="w-px h-6 bg-primary-foreground/30" />
                        <Button
                            onClick={handleCreateTask}
                            disabled={creating || !user?._id}
                            size="sm"
                            variant="secondary"
                            className="gap-2"
                        >
                            {creating ? (
                                <Spinner className="h-4 w-4" />
                            ) : (
                                <ClipboardList className="h-4 w-4" />
                            )}
                            Create Task
                        </Button>
                        <Button
                            onClick={() => setSelectedLeads([])}
                            size="sm"
                            variant="ghost"
                            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
