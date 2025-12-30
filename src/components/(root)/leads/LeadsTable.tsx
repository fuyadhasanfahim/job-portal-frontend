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
    'busy',
    'answering-machine',
    'interested',
    'not-interested',
    'test-trial',
    'call-back',
    'on-board',
    'no-answer',
    'email/whatsApp-sent',
    'language-barrier',
    'invalid-number',
];

export default function LeadsTable() {
    const [search, setSearch] = useState('');
    const [countryFilter, setCountryFilter] = useState<string>('all');
    const [sort, setSort] = useState<SortOption>('dateDesc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [status, setStatus] = useState('all');
    const [selectedRole, setSelectedRole] = useState('all-role');
    const [selectedUserId, setSelectedUserId] = useState('all-user');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [open, setOpen] = useState(false);
    const [groupFilter, setGroupFilter] = useState<string>('all');
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        id: string;
        name: string;
    }>({ open: false, id: '', name: '' });

    // Bulk assignment states
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignToUserId, setAssignToUserId] = useState<string>('');

    // Bulk group change states
    const [groupChangeDialogOpen, setGroupChangeDialogOpen] = useState(false);
    const [changeToGroupId, setChangeToGroupId] = useState<string>('');

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

    const { data, isLoading, isError, isFetching } = useGetLeadsQuery({
        page,
        limit: perPage,
        search,
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

    return (
        <Card>
            <CardContent>
                <Tabs
                    defaultValue="all"
                    value={status}
                    onValueChange={(val) => {
                        setStatus(val);
                        setPage(1);
                    }}
                >
                    <TabsList className="w-full">
                        {statusData.map((s, i) => (
                            <TabsTrigger
                                key={i}
                                value={s}
                                className="capitalize"
                            >
                                {s.replace('-', ' ')}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={status}>
                        {/* Filters */}
                        <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by company, contact, or country..."
                                    value={search}
                                    onChange={(e) => {
                                        setPage(1);
                                        setSearch(e.target.value);
                                    }}
                                    className="pl-10 border-gray-300"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Country Filter */}
                                <Select
                                    value={countryFilter}
                                    onValueChange={(val) => {
                                        setPage(1);
                                        setCountryFilter(val);
                                    }}
                                >
                                    <SelectTrigger
                                        id="country"
                                        className="capitalize"
                                    >
                                        <SelectValue placeholder="Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Countries
                                        </SelectItem>
                                        {countries?.map((c, i) => (
                                            <SelectItem
                                                key={i}
                                                value={c.name}
                                                className="capitalize"
                                            >
                                                {c.name}
                                            </SelectItem>
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
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Groups</SelectItem>
                                        {groups.map((group) => (
                                            <SelectItem key={group._id} value={group._id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
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

                                {/* Sort */}
                                <Select
                                    value={sort}
                                    onValueChange={(val) =>
                                        setSort(val as SortOption)
                                    }
                                >
                                    <SelectTrigger id="sort">
                                        <SelectValue
                                            placeholder="Sort by"
                                            className="capitalize"
                                        />
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
                                        <SelectItem value="statusAsc">
                                            Status A-Z
                                        </SelectItem>
                                        <SelectItem value="statusDesc">
                                            Status Z-A
                                        </SelectItem>
                                        <SelectItem value="dateAsc">
                                            Oldest first
                                        </SelectItem>
                                        <SelectItem value="dateDesc">
                                            Newest first
                                        </SelectItem>
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
                                    <SelectTrigger id="source" className="w-[140px]">
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
                                    <SelectTrigger id="content">
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

                        {/* Bulk Selection Controls for Admins */}
                        {isAdmin && pagination.totalItems > 0 && (
                            <div className="mt-4 flex items-center gap-4 p-3 bg-muted/30 rounded-lg border">
                                <span className="text-sm text-muted-foreground">
                                    Total: <strong>{pagination.totalItems}</strong> leads match your filters
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
                                        } catch (_error) {
                                            toast.error('Failed to select all leads');
                                        }
                                    }}
                                    className="gap-2"
                                >
                                    {isLoadingAllIds ? (
                                        <>Loading...</>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Select All {pagination.totalItems} Leads
                                        </>
                                    )}
                                </Button>
                                {selectedLeads.size > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedLeads(new Set())}
                                        className="text-muted-foreground"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Clear Selection ({selectedLeads.size})
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Table */}
                        <div className="mt-6 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-accent">
                                    <TableRow>
                                        {isAdmin && (
                                            <TableHead className="border w-[50px]">
                                                <Checkbox
                                                    checked={
                                                        leads.length > 0 &&
                                                        leads.every((lead: ILead) =>
                                                            selectedLeads.has(lead._id)
                                                        )
                                                    }
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            const newSet = new Set(selectedLeads);
                                                            leads.forEach((lead: ILead) =>
                                                                newSet.add(lead._id)
                                                            );
                                                            setSelectedLeads(newSet);
                                                        } else {
                                                            const newSet = new Set(selectedLeads);
                                                            leads.forEach((lead: ILead) =>
                                                                newSet.delete(lead._id)
                                                            );
                                                            setSelectedLeads(newSet);
                                                        }
                                                    }}
                                                    aria-label="Select all"
                                                />
                                            </TableHead>
                                        )}
                                        <TableHead className="border">
                                            Company
                                        </TableHead>
                                        <TableHead className="border">
                                            Website
                                        </TableHead>
                                        <TableHead className="border">
                                            Full Name
                                        </TableHead>
                                        <TableHead className="border">
                                            Emails
                                        </TableHead>
                                        <TableHead className="border">
                                            Phones
                                        </TableHead>
                                        <TableHead className="border">
                                            Designation
                                        </TableHead>
                                        <TableHead className="border">
                                            Address
                                        </TableHead>
                                        <TableHead className="border">
                                            Country
                                        </TableHead>
                                        <TableHead className="border">
                                            Status
                                        </TableHead>
                                        <TableHead className="border">
                                            Group
                                        </TableHead>
                                        <TableHead className="border">
                                            Notes
                                        </TableHead>
                                        <TableHead className="border text-center">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {isLoading || isFetching ? (
                                        Array.from({ length: perPage }).map(
                                            (_, i) => (
                                                <TableRow key={i}>
                                                    {Array.from({
                                                        length: 12,
                                                    }).map((__, j) => (
                                                        <TableCell
                                                            key={j}
                                                            className="border"
                                                        >
                                                            <Skeleton className="h-6 w-24" />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            )
                                        )
                                    ) : isError ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={11}
                                                className="text-center py-12 text-destructive border"
                                            >
                                                Failed to load leads
                                            </TableCell>
                                        </TableRow>
                                    ) : leads.length ? (
                                        leads.map((lead: ILead) => {
                                            const contact =
                                                lead.contactPersons?.[0];
                                            const fullName =
                                                [
                                                    contact?.firstName,
                                                    contact?.lastName,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ') || 'N/A';

                                            return (
                                                <TableRow key={lead._id} className={selectedLeads.has(lead._id) ? 'bg-primary/5' : ''}>
                                                    {/* Checkbox */}
                                                    {isAdmin && (
                                                        <TableCell className="border">
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
                                                    )}
                                                    {/* Company */}
                                                    <TableCell className="border font-medium max-w-[200px] truncate">
                                                        {lead.company.name}
                                                    </TableCell>

                                                    {/* Website */}
                                                    <TableCell className="border text-blue-600 underline max-w-[200px] truncate">
                                                        {lead.company
                                                            .website ? (
                                                            <Link
                                                                href={
                                                                    lead.company.website.startsWith(
                                                                        'http'
                                                                    )
                                                                        ? lead
                                                                            .company
                                                                            .website
                                                                        : `https://${lead.company.website}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="hover:text-blue-700"
                                                            >
                                                                {
                                                                    lead.company
                                                                        .website
                                                                }
                                                            </Link>
                                                        ) : (
                                                            'N/A'
                                                        )}
                                                    </TableCell>

                                                    {/* Full Name */}
                                                    <TableCell className="border capitalize">
                                                        {fullName}
                                                    </TableCell>

                                                    {/* Emails */}
                                                    <TableCell className="border truncate max-w-[200px]">
                                                        <div className="space-y-1">
                                                            {lead.contactPersons?.flatMap(
                                                                (cp, ci) =>
                                                                    cp.emails?.map(
                                                                        (
                                                                            email,
                                                                            ei
                                                                        ) => (
                                                                            <p
                                                                                className="truncate max-w-[200px]"
                                                                                key={`cp-email-${lead._id}-${ci}-${ei}`}
                                                                            >
                                                                                {
                                                                                    email
                                                                                }
                                                                            </p>
                                                                        )
                                                                    )
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Phones */}
                                                    <TableCell className="border truncate max-w-[200px]">
                                                        <div className="space-y-1">
                                                            {lead.contactPersons?.flatMap(
                                                                (cp, ci) =>
                                                                    cp.phones?.map(
                                                                        (
                                                                            phone,
                                                                            pi
                                                                        ) => (
                                                                            <p
                                                                                key={`cp-phone-${lead._id}-${ci}-${pi}`}
                                                                            >
                                                                                {
                                                                                    phone
                                                                                }
                                                                            </p>
                                                                        )
                                                                    )
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Designation */}
                                                    <TableCell className="border truncate max-w-[200px] capitalize">
                                                        {contact?.designation ||
                                                            'N/A'}
                                                    </TableCell>

                                                    {/* Address */}
                                                    <TableCell className="border max-w-[200px] truncate capitalize">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <span className="block max-w-[200px] truncate cursor-help">
                                                                    {lead.address ||
                                                                        'N/A'}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-sm wrap-break-word">
                                                                {lead.address ||
                                                                    'N/A'}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TableCell>

                                                    {/* Country */}
                                                    <TableCell className="border capitalize">
                                                        {lead.country || 'N/A'}
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="border capitalize">
                                                        {lead.status.replace(
                                                            /-/g,
                                                            ' '
                                                        )}
                                                    </TableCell>

                                                    {/* Group */}
                                                    <TableCell className="border">
                                                        {lead.group ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div
                                                                    className="w-2.5 h-2.5 rounded-full"
                                                                    style={{ backgroundColor: lead.group.color || '#6366f1' }}
                                                                />
                                                                <span className="truncate max-w-[100px]">{lead.group.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* notes */}
                                                    <TableCell className="border max-w-[200px] truncate">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <span className="block max-w-[200px] truncate cursor-help">
                                                                    {lead
                                                                        .activities?.[0]
                                                                        ?.notes ||
                                                                        'N/A'}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-sm wrap-break-word">
                                                                {lead
                                                                    .activities?.[0]
                                                                    ?.notes ||
                                                                    'N/A'}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="border text-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                >
                                                                    <Ellipsis className="h-5 w-5 text-gray-600" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-36"
                                                            >
                                                                <DropdownMenuItem
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={`/leads/details/${lead._id}`}
                                                                    >
                                                                        <IconInfoCircle className="mr-2 h-4 w-4" />
                                                                        Details
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={`/leads/edit/${lead._id}`}
                                                                    >
                                                                        <IconEdit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() =>
                                                                        setDeleteDialog({
                                                                            open: true,
                                                                            id: lead._id,
                                                                            name: lead.company.name,
                                                                        })
                                                                    }
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
                                            <TableCell
                                                colSpan={12}
                                                className="text-center py-12 text-gray-500 border"
                                            >
                                                No leads found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center pt-4">
                            <div className="text-sm text-gray-600">
                                Showing{' '}
                                <span className="font-medium text-gray-900">
                                    {(page - 1) * perPage + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium text-gray-900">
                                    {Math.min(
                                        page * perPage,
                                        pagination.totalItems
                                    )}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium text-gray-900">
                                    {pagination.totalItems}
                                </span>{' '}
                                leads
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="gap-1"
                                >
                                    <ChevronLeft />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === pagination.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="gap-1"
                                >
                                    Next
                                    <ChevronRight />
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog((prev) => ({ ...prev, open }))
                }
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>&quot;{deleteDialog.name}&quot;</strong>?
                            This lead will be moved to trash and can be
                            restored by an admin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                            onClick={async () => {
                                try {
                                    await deleteLead({
                                        id: deleteDialog.id,
                                    }).unwrap();
                                    toast.success(
                                        `Lead "${deleteDialog.name}" deleted successfully`
                                    );
                                    setDeleteDialog({
                                        open: false,
                                        id: '',
                                        name: '',
                                    });
                                } catch (error) {
                                    toast.error(
                                        (
                                            error as {
                                                data?: { message?: string };
                                            }
                                        )?.data?.message ||
                                        'Failed to delete lead'
                                    );
                                }
                            }}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Assign Floating Action Bar */}
            {isAdmin && selectedLeads.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4 px-6 py-4 bg-background/95 backdrop-blur-lg border border-border/50 rounded-2xl shadow-2xl">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                                {selectedLeads.size}
                            </div>
                            <span className="text-sm font-medium">leads selected</span>
                        </div>

                        <div className="w-px h-8 bg-border" />

                        <Select
                            value={assignToUserId}
                            onValueChange={setAssignToUserId}
                        >
                            <SelectTrigger className="w-[200px] bg-background">
                                <UserPlus className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                                {usersData?.users?.map((u: IUser) => (
                                    <SelectItem key={u._id} value={u._id}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {u.firstName} {u.lastName}
                                            </span>
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {u.role?.replace(/-/g, ' ')}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() => setAssignDialogOpen(true)}
                            disabled={!assignToUserId || isAssigning}
                            className="gap-2"
                            size="sm"
                        >
                            {isAssigning ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Assign
                                </>
                            )}
                        </Button>

                        <div className="w-px h-8 bg-border" />

                        {/* Group Change Section */}
                        <Select
                            value={changeToGroupId}
                            onValueChange={setChangeToGroupId}
                        >
                            <SelectTrigger className="w-[180px] bg-background">
                                <Folder className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Move to group..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no-group">
                                    <span className="text-muted-foreground">No Group</span>
                                </SelectItem>
                                {groups.map((g) => (
                                    <SelectItem key={g._id} value={g._id}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: g.color || '#6b7280' }}
                                            />
                                            {g.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() => setGroupChangeDialogOpen(true)}
                            disabled={!changeToGroupId || isChangingGroup}
                            className="gap-2"
                            size="sm"
                            variant="secondary"
                        >
                            {isChangingGroup ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                                    Moving...
                                </>
                            ) : (
                                <>
                                    <Folder className="w-4 h-4" />
                                    Move
                                </>
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSelectedLeads(new Set());
                                setAssignToUserId('');
                                setChangeToGroupId('');
                            }}
                            className="text-muted-foreground hover:text-foreground"
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
                            You are about to assign{' '}
                            <strong>{selectedLeads.size} leads</strong> to{' '}
                            <strong>
                                {usersData?.users?.find((u: IUser) => u._id === assignToUserId)?.firstName || 'selected user'}
                            </strong>.
                            This action will update the owner of all selected leads.
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

                                    const targetUser = usersData?.users?.find(
                                        (u: IUser) => u._id === assignToUserId
                                    );

                                    toast.success(
                                        `Successfully assigned ${result.results?.success || selectedLeads.size} leads to ${targetUser?.firstName || 'user'}`
                                    );

                                    setSelectedLeads(new Set());
                                    setAssignToUserId('');
                                    setAssignDialogOpen(false);
                                } catch (error) {
                                    toast.error(
                                        (error as { data?: { message?: string } })?.data?.message ||
                                        'Failed to assign leads'
                                    );
                                }
                            }}
                        >
                            {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
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
                            You are about to move{' '}
                            <strong>{selectedLeads.size} leads</strong> to{' '}
                            <strong>
                                {changeToGroupId === 'no-group'
                                    ? 'No Group'
                                    : groups.find((g) => g._id === changeToGroupId)?.name || 'selected group'}
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

                                    toast.success(
                                        `Successfully moved ${result.results?.success || selectedLeads.size} leads to "${targetGroup}"`
                                    );

                                    setSelectedLeads(new Set());
                                    setChangeToGroupId('');
                                    setGroupChangeDialogOpen(false);
                                } catch (error) {
                                    toast.error(
                                        (error as { data?: { message?: string } })?.data?.message ||
                                        'Failed to change group'
                                    );
                                }
                            }}
                        >
                            {isChangingGroup ? 'Moving...' : 'Confirm Move'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

