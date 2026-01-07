'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Ellipsis,
    ChevronLeft,
    ChevronRight,
    Search,
    ChevronDownIcon,
    X,
    UserPlus,
    Check,
    Folder,
    RotateCcw,
    CalendarIcon,
    ClipboardList,
} from 'lucide-react';
import { useGetLeadsQuery, useDeleteLeadMutation, useBulkAssignLeadsMutation, useLazyGetAllMatchingLeadIdsQuery, useBulkChangeGroupMutation } from '@/redux/features/lead/leadApi';
import { useGetGroupsQuery } from '@/redux/features/group/groupApi';
import { useGetAllUsersQuery } from '@/redux/features/user/userApi';
import type { IGroup } from '@/types/group.interface';
import { Skeleton } from '@/components/ui/skeleton';
import { ILead } from '@/types/lead.interface';
import { IUser } from '@/types/user.interface';
import { useGetCountriesQuery } from '@/redux/features/country/countryApi';
import Link from 'next/link';
import { IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserFilterSelects } from '@/components/shared/UserFilterSelects';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { useSignedUser } from '@/hooks/useSignedUser';
import { toast } from 'sonner';

type SortOption =
    | 'companyAsc'
    | 'companyDesc'
    | 'countryAsc'
    | 'countryDesc'
    | 'statusAsc'
    | 'statusDesc'
    | 'dateAsc'
    | 'dateDesc';

const statusData = [
    'all',
    'new',
    'answering-machine',
    'interested',
    'not-interested',
    'test-trial',
    'call-back',
    'on-board',
    'language-barrier',
    'invalid-number',
];

export default function LeadsTable() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL params
    const getParamValue = (key: string, defaultValue: string) => {
        return searchParams.get(key) || defaultValue;
    };

    const [search, setSearch] = React.useState(getParamValue('search', ''));
    const [countryFilter, setCountryFilter] = React.useState(getParamValue('country', 'all'));
    const [sort, setSort] = React.useState<SortOption>(getParamValue('sort', 'dateDesc') as SortOption);
    const [page, setPage] = React.useState(parseInt(getParamValue('page', '1')));
    const [perPage, setPerPage] = React.useState(parseInt(getParamValue('perPage', '20')));
    const [status, setStatus] = React.useState(getParamValue('status', 'all'));
    const [selectedRole, setSelectedRole] = React.useState(getParamValue('role', 'all-role'));
    const [selectedUserId, setSelectedUserId] = React.useState(getParamValue('userId', 'all-user'));
    const [date, setDate] = React.useState<Date | undefined>(
        searchParams.get('date') ? new Date(searchParams.get('date')!) : undefined
    );
    const [open, setOpen] = React.useState(false);
    const [groupFilter, setGroupFilter] = React.useState(getParamValue('group', 'all'));
    const [sourceFilter, setSourceFilter] = React.useState(getParamValue('source', 'all'));
    const [deleteDialog, setDeleteDialog] = React.useState<{
        open: boolean;
        id: string;
        name: string;
    }>({ open: false, id: '', name: '' });

    // Bulk assignment states
    const [selectedLeads, setSelectedLeads] = React.useState<Set<string>>(new Set());
    const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
    const [assignToUserId, setAssignToUserId] = React.useState<string>('');

    // Bulk group change states
    const [groupChangeDialogOpen, setGroupChangeDialogOpen] = React.useState(false);
    const [changeToGroupId, setChangeToGroupId] = React.useState<string>('');

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = React.useState(search);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const { user } = useSignedUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

    const { data: countries } = useGetCountriesQuery({});
    const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();
    const [bulkAssignLeads, { isLoading: isAssigning }] = useBulkAssignLeadsMutation();
    const [bulkChangeGroup, { isLoading: isChangingGroup }] = useBulkChangeGroupMutation();
    const [getAllMatchingLeadIds, { isFetching: isLoadingAllIds }] = useLazyGetAllMatchingLeadIdsQuery();
    const { data: groupsResponse } = useGetGroupsQuery();
    const groups: IGroup[] = groupsResponse?.data || [];
    const { data: usersData } = useGetAllUsersQuery({ includeAdmins: true });

    // Update URL params when filters change
    const updateUrlParams = useCallback(() => {
        const params = new URLSearchParams();

        if (search) params.set('search', search);
        if (countryFilter !== 'all') params.set('country', countryFilter);
        if (sort !== 'dateDesc') params.set('sort', sort);
        if (page !== 1) params.set('page', page.toString());
        if (perPage !== 20) params.set('perPage', perPage.toString());
        if (status !== 'all') params.set('status', status);
        if (selectedRole !== 'all-role') params.set('role', selectedRole);
        if (selectedUserId !== 'all-user') params.set('userId', selectedUserId);
        if (date) params.set('date', date.toISOString().split('T')[0]);
        if (groupFilter !== 'all') params.set('group', groupFilter);
        if (sourceFilter !== 'all') params.set('source', sourceFilter);

        const queryString = params.toString();
        const newUrl = queryString ? `?${queryString}` : window.location.pathname;

        router.replace(newUrl, { scroll: false });
    }, [search, countryFilter, sort, page, perPage, status, selectedRole, selectedUserId, date, groupFilter, sourceFilter, router]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            updateUrlParams();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [updateUrlParams]);

    // Reset all filters
    const resetFilters = () => {
        setSearch('');
        setCountryFilter('all');
        setSort('dateDesc');
        setPage(1);
        setPerPage(20);
        setStatus('all');
        setSelectedRole('all-role');
        setSelectedUserId('all-user');
        setDate(undefined);
        setGroupFilter('all');
        setSourceFilter('all');
        setSelectedLeads(new Set());
        router.replace(window.location.pathname, { scroll: false });
    };

    // Check if any filter is active
    const hasActiveFilters = search || countryFilter !== 'all' || sort !== 'dateDesc' ||
        status !== 'all' || selectedRole !== 'all-role' || selectedUserId !== 'all-user' ||
        date || groupFilter !== 'all' || sourceFilter !== 'all';

    const getSortParams = () => {
        switch (sort) {
            case 'companyAsc':
                return { sortBy: 'company.name', sortOrder: 'asc' };
            case 'companyDesc':
                return { sortBy: 'company.name', sortOrder: 'desc' };
            case 'countryAsc':
                return { sortBy: 'country', sortOrder: 'asc' };
            case 'countryDesc':
                return { sortBy: 'country', sortOrder: 'desc' };
            case 'statusAsc':
                return { sortBy: 'status', sortOrder: 'asc' };
            case 'statusDesc':
                return { sortBy: 'status', sortOrder: 'desc' };
            case 'dateAsc':
                return { sortBy: 'createdAt', sortOrder: 'asc' };
            case 'dateDesc':
            default:
                return { sortBy: 'createdAt', sortOrder: 'desc' };
        }
    };

    const { sortBy, sortOrder } = getSortParams();

    const { data, isLoading, isError } = useGetLeadsQuery({
        page,
        limit: perPage,
        search: debouncedSearch,
        country: countryFilter,
        sortBy,
        sortOrder,
        status,
        selectedUserId,
        date: date ? date.toLocaleDateString('en-CA') : '',
        group: groupFilter !== 'all' ? groupFilter : undefined,
        source: sourceFilter !== 'all' ? sourceFilter : undefined,
    });

    const leads = data?.data ?? [];
    const pagination = data?.pagination ?? { totalItems: 0, totalPages: 1 };


    // Table skeleton component
    const TableSkeleton = () => (
        <>
            {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                    {isAdmin && (
                        <TableCell className="py-3">
                            <Skeleton className="h-4 w-4 rounded" />
                        </TableCell>
                    )}
                    <TableCell className="py-3"><Skeleton className="h-4 w-28 rounded-full" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-32 rounded-full" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-36 rounded-full" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-20 rounded-full" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-16 rounded-full" /></TableCell>
                    <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                        </div>
                    </TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-32 rounded-full" /></TableCell>
                    <TableCell className="py-3 text-center"><Skeleton className="h-6 w-6 rounded mx-auto" /></TableCell>
                </TableRow>
            ))}
        </>
    );

    return (
        <Card className="shadow-sm">
            <CardContent className="p-6">
                <Tabs
                    defaultValue="all"
                    value={status}
                    onValueChange={(val) => {
                        setStatus(val);
                        setPage(1);
                    }}
                >
                    <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                        {statusData.map((s, i) => (
                            <TabsTrigger
                                key={i}
                                value={s}
                                className="capitalize text-xs px-3 py-1.5"
                            >
                                {s.replace(/-/g, ' ')}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={status} className="mt-0">
                        {/* Filters */}
                        <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search company, contact..."
                                    value={search}
                                    onChange={(e) => {
                                        setPage(1);
                                        setSearch(e.target.value);
                                    }}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Country Filter */}
                                <Select
                                    value={countryFilter}
                                    onValueChange={(val) => {
                                        setPage(1);
                                        setCountryFilter(val);
                                    }}
                                >
                                    <SelectTrigger className="w-[130px] h-9 text-sm capitalize">
                                        <SelectValue placeholder="Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Countries</SelectItem>
                                        {countries?.map((c, i) => (
                                            <SelectItem key={i} value={c.name} className="capitalize">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Group Filter */}
                                <Select
                                    value={groupFilter}
                                    onValueChange={(val) => {
                                        setPage(1);
                                        setGroupFilter(val);
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] h-9 text-sm">
                                        <SelectValue placeholder="Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Groups</SelectItem>
                                        {groups.map((group) => (
                                            <SelectItem key={group._id} value={group._id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: group.color || '#6366f1' }}
                                                    />
                                                    {group.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="h-9 text-sm w-auto justify-between font-normal">
                                            {date ? date.toLocaleDateString() : 'Date'}
                                            <ChevronDownIcon className="h-4 w-4 ml-1" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
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

                                {/* Sort */}
                                <Select value={sort} onValueChange={(val) => setSort(val as SortOption)}>
                                    <SelectTrigger className="w-[120px] h-9 text-sm">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="companyAsc">Company A-Z</SelectItem>
                                        <SelectItem value="companyDesc">Company Z-A</SelectItem>
                                        <SelectItem value="countryAsc">Country A-Z</SelectItem>
                                        <SelectItem value="countryDesc">Country Z-A</SelectItem>
                                        <SelectItem value="dateAsc">Oldest first</SelectItem>
                                        <SelectItem value="dateDesc">Newest first</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Source Filter */}
                                <Select
                                    value={sourceFilter}
                                    onValueChange={(val) => {
                                        setSourceFilter(val);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] h-9 text-sm">
                                        <SelectValue placeholder="Source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sources</SelectItem>
                                        <SelectItem value="imported">📥 Imported</SelectItem>
                                        <SelectItem value="manual">✏️ Manual</SelectItem>
                                        <SelectItem value="website">🌐 Website</SelectItem>
                                    </SelectContent>
                                </Select>

                                <UserFilterSelects
                                    selectedRole={selectedRole}
                                    setSelectedRole={setSelectedRole}
                                    selectedUserId={selectedUserId}
                                    setSelectedUserId={setSelectedUserId}
                                />

                                {/* Per Page */}
                                <Select
                                    value={String(perPage)}
                                    onValueChange={(val) => {
                                        setPage(1);
                                        setPerPage(Number(val));
                                    }}
                                >
                                    <SelectTrigger className="w-[90px] h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[20, 50, 100].map((n) => (
                                            <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Reset Button */}
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetFilters}
                                        className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Bulk Selection Controls */}
                        {pagination.totalItems > 0 && (
                            <div className="mt-4 flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg text-sm">
                                <span className="text-muted-foreground">
                                    Total: <strong className="text-foreground">{pagination.totalItems}</strong> leads
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoadingAllIds}
                                    onClick={async () => {
                                        try {
                                            const result = await getAllMatchingLeadIds({
                                                search,
                                                status: status !== 'all' ? status : undefined,
                                                country: countryFilter !== 'all' ? countryFilter : undefined,
                                                selectedUserId: selectedUserId !== 'all-user' ? selectedUserId : undefined,
                                                group: groupFilter !== 'all' ? groupFilter : undefined,
                                            }).unwrap();

                                            if (result.leadIds) {
                                                setSelectedLeads(new Set(result.leadIds));
                                                toast.success(`Selected ${result.leadIds.length} leads`);
                                            }
                                        } catch {
                                            toast.error('Failed to select all leads');
                                        }
                                    }}
                                    className="h-7 text-xs gap-1.5"
                                >
                                    {isLoadingAllIds ? 'Loading...' : (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            Select All
                                        </>
                                    )}
                                </Button>
                                {selectedLeads.size > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedLeads(new Set())}
                                        className="h-7 text-xs text-muted-foreground"
                                    >
                                        <X className="w-3.5 h-3.5 mr-1" />
                                        Clear ({selectedLeads.size})
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Table */}
                        <div className="mt-4 overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="w-10 text-center">
                                            <Checkbox
                                                checked={leads.length > 0 && leads.every((lead: ILead) => selectedLeads.has(lead._id))}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        const newSet = new Set(selectedLeads);
                                                        leads.forEach((lead: ILead) => newSet.add(lead._id));
                                                        setSelectedLeads(newSet);
                                                    } else {
                                                        const newSet = new Set(selectedLeads);
                                                        leads.forEach((lead: ILead) => newSet.delete(lead._id));
                                                        setSelectedLeads(newSet);
                                                    }
                                                }}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold">Company</TableHead>
                                        <TableHead className="text-xs font-semibold">Website</TableHead>
                                        <TableHead className="text-xs font-semibold w-[140px]">Name</TableHead>
                                        <TableHead className="text-xs font-semibold">Emails</TableHead>
                                        <TableHead className="text-xs font-semibold">Designation</TableHead>
                                        <TableHead className="text-xs font-semibold">Country</TableHead>
                                        <TableHead className="text-xs font-semibold">Group</TableHead>
                                        <TableHead className="text-xs font-semibold">Notes</TableHead>
                                        <TableHead className="text-xs font-semibold text-center w-16">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {isLoading && !leads.length ? (
                                        <TableSkeleton />
                                    ) : isError ? (
                                        <TableRow>
                                        <TableCell colSpan={10} className="text-center py-16 text-destructive">
                                                Failed to load leads
                                            </TableCell>
                                        </TableRow>
                                    ) : leads.length ? (
                                        leads.map((lead: ILead) => {
                                            const contact = lead.contactPersons?.[0];
                                            const fullName = [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || '—';

                                            return (
                                                <TableRow
                                                    key={lead._id}
                                                    className={`${selectedLeads.has(lead._id) ? 'bg-primary/5' : ''} hover:bg-muted/30`}
                                                >
                                                    <TableCell className="text-center py-2.5">
                                                        <Checkbox
                                                            checked={selectedLeads.has(lead._id)}
                                                            onCheckedChange={(checked) => {
                                                                const newSet = new Set(selectedLeads);
                                                                if (checked) {
                                                                    newSet.add(lead._id);
                                                                } else {
                                                                    newSet.delete(lead._id);
                                                                }
                                                                setSelectedLeads(newSet);
                                                            }}
                                                            aria-label={`Select ${lead.company.name}`}
                                                        />
                                                    </TableCell>

                                                    <TableCell className="font-medium text-sm max-w-[150px] truncate py-2.5">
                                                        {lead.company.name}
                                                    </TableCell>

                                                    <TableCell className="text-sm max-w-[150px] truncate py-2.5">
                                                        {lead.company.website ? (
                                                            <Link
                                                                href={lead.company.website.startsWith('http') ? lead.company.website : `https://${lead.company.website}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary hover:underline"
                                                            >
                                                                {lead.company.website}
                                                            </Link>
                                                        ) : '—'}
                                                    </TableCell>

                                                    <TableCell className="text-sm capitalize py-2.5 w-[140px] max-w-[140px] truncate">{fullName}</TableCell>

                                                    <TableCell className="text-sm max-w-[180px] truncate py-2.5">
                                                        {lead.contactPersons?.flatMap(cp => cp.emails)?.slice(0, 2)?.join(', ') || '—'}
                                                    </TableCell>

                                                    <TableCell className="text-sm capitalize max-w-[120px] truncate py-2.5">
                                                        {contact?.designation || '—'}
                                                    </TableCell>

                                                    <TableCell className="text-sm capitalize py-2.5">{lead.country || '—'}</TableCell>

                                                    <TableCell className="py-2.5">
                                                        {lead.group ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div
                                                                    className="w-2 h-2 rounded-full shrink-0"
                                                                    style={{ backgroundColor: lead.group.color || '#6366f1' }}
                                                                />
                                                                <span className="text-sm truncate max-w-[80px]">{lead.group.name}</span>
                                                            </div>
                                                        ) : <span className="text-muted-foreground">—</span>}
                                                    </TableCell>


                                                    <TableCell className="text-sm max-w-[150px] py-2.5">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="block truncate cursor-help text-muted-foreground">
                                                                    {lead.activities?.[0]?.notes || '—'}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-sm wrap-break-word">
                                                                {lead.activities?.[0]?.notes || 'No notes'}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TableCell>

                                                    <TableCell className="text-center py-2.5">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                    <Ellipsis className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-36">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/leads/details/${lead._id}`}>
                                                                        <IconInfoCircle className="mr-2 h-4 w-4" />
                                                                        Details
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/leads/edit/${lead._id}`}>
                                                                        <IconEdit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/tasks/create-task?leadId=${lead._id}`}>
                                                                        <ClipboardList className="mr-2 h-4 w-4" />
                                                                        Create Task
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => setDeleteDialog({ open: true, id: lead._id, name: lead.company.name })}
                                                                >
                                                                    <IconTrash className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-16 text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="h-8 w-8 text-muted-foreground/50" />
                                                    <p>No leads found</p>
                                                    {hasActiveFilters && (
                                                        <Button variant="link" size="sm" onClick={resetFilters}>
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
                        <div className="flex justify-between items-center pt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <span className="font-medium text-foreground">{(page - 1) * perPage + 1}</span> to{' '}
                                <span className="font-medium text-foreground">{Math.min(page * perPage, pagination.totalItems)}</span> of{' '}
                                <span className="font-medium text-foreground">{pagination.totalItems}</span> leads
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="gap-1 h-8"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>

                                {/* Page Numbers */}
                                {(() => {
                                    const totalPages = pagination.totalPages;
                                    const pages: (number | string)[] = [];

                                    if (totalPages <= 7) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        pages.push(1);
                                        if (page > 3) pages.push('...');
                                        const start = Math.max(2, page - 1);
                                        const end = Math.min(totalPages - 1, page + 1);
                                        for (let i = start; i <= end; i++) {
                                            if (!pages.includes(i)) pages.push(i);
                                        }
                                        if (page < totalPages - 2) pages.push('...');
                                        if (!pages.includes(totalPages)) pages.push(totalPages);
                                    }

                                    return pages.map((p, idx) => (
                                        p === '...' ? (
                                            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                                        ) : (
                                            <Button
                                                key={p}
                                                variant={page === p ? 'default' : 'outline'}
                                                size="sm"
                                                className="min-w-[32px] h-8"
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
                                    disabled={page === pagination.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="gap-1 h-8"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>&quot;{deleteDialog.name}&quot;</strong>?
                            This lead will be moved to trash and can be restored by an admin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                            onClick={async () => {
                                try {
                                    await deleteLead({ id: deleteDialog.id }).unwrap();
                                    toast.success(`Lead "${deleteDialog.name}" deleted successfully`);
                                    setDeleteDialog({ open: false, id: '', name: '' });
                                } catch (error) {
                                    toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to delete lead');
                                }
                            }}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Assign Floating Action Bar */}
            {selectedLeads.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 px-5 py-3 bg-background/95 backdrop-blur-lg border rounded-xl shadow-xl">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                                {selectedLeads.size}
                            </div>
                            <span className="text-sm font-medium">selected</span>
                        </div>

                        <div className="w-px h-6 bg-border" />

                        <Select value={assignToUserId} onValueChange={setAssignToUserId}>
                            <SelectTrigger className="w-[180px] h-8 text-sm bg-background">
                                <UserPlus className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                                {usersData?.users?.map((u: IUser) => (
                                    <SelectItem key={u._id} value={u._id}>
                                        <span className="font-medium">{u.firstName} {u.lastName}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() => setAssignDialogOpen(true)}
                            disabled={!assignToUserId || isAssigning}
                            className="gap-1.5 h-8"
                            size="sm"
                        >
                            {isAssigning ? 'Assigning...' : <><Check className="w-4 h-4" />Assign</>}
                        </Button>

                        <div className="w-px h-6 bg-border" />

                        <Select value={changeToGroupId} onValueChange={setChangeToGroupId}>
                            <SelectTrigger className="w-[150px] h-8 text-sm bg-background">
                                <Folder className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Move to..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no-group"><span className="text-muted-foreground">No Group</span></SelectItem>
                                {groups.map((g) => (
                                    <SelectItem key={g._id} value={g._id}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color || '#6b7280' }} />
                                            {g.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() => setGroupChangeDialogOpen(true)}
                            disabled={!changeToGroupId || isChangingGroup}
                            className="gap-1.5 h-8"
                            size="sm"
                            variant="secondary"
                        >
                            {isChangingGroup ? 'Moving...' : <><Folder className="w-4 h-4" />Move</>}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSelectedLeads(new Set());
                                setAssignToUserId('');
                                setChangeToGroupId('');
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Bulk Assign Confirmation Dialog */}
            <AlertDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-primary" />
                            Assign Leads
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to assign <strong>{selectedLeads.size} leads</strong> to{' '}
                            <strong>{usersData?.users?.find((u: IUser) => u._id === assignToUserId)?.firstName || 'selected user'}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isAssigning}
                            onClick={async () => {
                                try {
                                    const result = await bulkAssignLeads({
                                        leadIds: Array.from(selectedLeads),
                                        targetUserId: assignToUserId,
                                    }).unwrap();

                                    const targetUser = usersData?.users?.find((u: IUser) => u._id === assignToUserId);
                                    toast.success(`Successfully assigned ${result.results?.success || selectedLeads.size} leads to ${targetUser?.firstName || 'user'}`);

                                    setSelectedLeads(new Set());
                                    setAssignToUserId('');
                                    setAssignDialogOpen(false);
                                } catch (error) {
                                    toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to assign leads');
                                }
                            }}
                        >
                            {isAssigning ? 'Assigning...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Group Change Confirmation Dialog */}
            <AlertDialog open={groupChangeDialogOpen} onOpenChange={setGroupChangeDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Folder className="w-5 h-5 text-primary" />
                            Change Group
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to move <strong>{selectedLeads.size} leads</strong> to{' '}
                            <strong>
                                {changeToGroupId === 'no-group' ? 'No Group' : groups.find((g) => g._id === changeToGroupId)?.name || 'selected group'}
                            </strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isChangingGroup}
                            onClick={async () => {
                                try {
                                    const result = await bulkChangeGroup({
                                        leadIds: Array.from(selectedLeads),
                                        targetGroupId: changeToGroupId === 'no-group' ? null : changeToGroupId,
                                    }).unwrap();

                                    const targetGroup = changeToGroupId === 'no-group'
                                        ? 'No Group'
                                        : groups.find((g) => g._id === changeToGroupId)?.name || 'group';

                                    toast.success(`Successfully moved ${result.results?.success || selectedLeads.size} leads to "${targetGroup}"`);

                                    setSelectedLeads(new Set());
                                    setChangeToGroupId('');
                                    setGroupChangeDialogOpen(false);
                                } catch (error) {
                                    toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to change group');
                                }
                            }}
                        >
                            {isChangingGroup ? 'Moving...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
