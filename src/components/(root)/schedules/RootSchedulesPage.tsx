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
import { Badge } from '@/components/ui/badge';
import {
    ChevronDownIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    CalendarDays,
    RotateCcw,
    Pencil,
    Trash2,
    CheckSquare,
    X,
    FolderPlus,
    ClipboardPlus,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { useGetCountriesQuery } from '@/redux/features/country/countryApi';
import { IUser } from '@/types/user.interface';
import {
    useGetLeadsQuery,
    useBulkDeleteLeadsMutation,
    useBulkChangeGroupMutation,
} from '@/redux/features/lead/leadApi';
import { useGetGroupsQuery } from '@/redux/features/group/groupApi';
import { useCreateTaskMutation } from '@/redux/features/task/taskApi';
import { ILead } from '@/types/lead.interface';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Calendar } from '@/components/ui/calendar';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { useSignedUser } from '@/hooks/useSignedUser';
import { useTableColumns } from '@/hooks/useTableColumns';
import { ColumnCustomizerDialog } from '@/components/shared/ColumnCustomizerDialog';

// Only show specific statuses (no "all")
const statusTabs = [
    { value: 'interested', label: 'Interested' },
    { value: 'not-interested', label: 'Not Interested' },
    { value: 'test-trial', label: 'Test Trial' },
    { value: 'call-back', label: 'Call Back' },
];

// Copy text helper
const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
};

// Tooltip cell component
const TooltipCell = ({
    value,
    className,
}: {
    value?: string | null;
    className?: string;
}) => {
    if (!value) return <span className="text-muted-foreground">—</span>;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className={cn(
                            'cursor-pointer hover:text-primary transition-colors truncate block',
                            className
                        )}
                        onClick={() => copyToClipboard(value)}
                    >
                        {value}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Click to copy
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default function RootSchedulesPage() {
    const { user } = useSignedUser();
    const { isColumnVisible } = useTableColumns('schedules');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [countryFilter, setCountryFilter] = useState('all');
    const [status, setStatus] = useState('interested');
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');

    // Selection mode
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

    // Dialogs
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
    const [groupDialog, setGroupDialog] = useState(false);
    const [createTaskDialog, setCreateTaskDialog] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [taskTitle, setTaskTitle] = useState('');

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
    const groups = groupsData?.data ?? [];

    // API mutations
    const [bulkDeleteLeads, { isLoading: isBulkDeleting }] =
        useBulkDeleteLeadsMutation();
    const [bulkChangeGroup, { isLoading: isChangingGroup }] =
        useBulkChangeGroupMutation();
    const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();

    const { data, isLoading, isFetching } = useGetLeadsQuery({
        page,
        limit: perPage,
        country: countryFilter,
        status: status,
        date: date ? date.toLocaleDateString('en-CA') : '',
        search: debouncedSearch,
        group: groupFilter,
    });

    const leads = data?.data ?? [];
    const pagination = data?.pagination ?? { totalItems: 0, totalPages: 1 };

    const resetFilters = () => {
        setCountryFilter('all');
        setGroupFilter('all');
        setDate(undefined);
        setSearchTerm('');
        setPage(1);
    };

    const hasActiveFilters =
        countryFilter !== 'all' || groupFilter !== 'all' || date || searchTerm;

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedLeads(leads.map((lead: ILead) => lead._id));
        } else {
            setSelectedLeads([]);
        }
    };

    const handleToggleLead = (id: string) => {
        setSelectedLeads((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedLeads([]);
    };

    // Bulk actions
    const handleBulkDelete = async () => {
        try {
            const result = await bulkDeleteLeads({
                leadIds: selectedLeads,
            }).unwrap();
            toast.success(
                result.message || `${result.successCount} leads deleted`
            );
            setBulkDeleteDialog(false);
            exitSelectionMode();
        } catch (error) {
            toast.error(
                (error as { data?: { message?: string } })?.data?.message ||
                    'Failed to delete'
            );
        }
    };

    const handleChangeGroup = async () => {
        if (!selectedGroupId) {
            toast.error('Please select a group');
            return;
        }
        try {
            const result = await bulkChangeGroup({
                leadIds: selectedLeads,
                targetGroupId:
                    selectedGroupId === 'none' ? null : selectedGroupId,
            }).unwrap();
            toast.success(
                result.message || `Group changed for ${result.success} leads`
            );
            setGroupDialog(false);
            setSelectedGroupId('');
            exitSelectionMode();
        } catch (error) {
            toast.error(
                (error as { data?: { message?: string } })?.data?.message ||
                    'Failed to change group'
            );
        }
    };

    // Auto generate task title
    const generateTaskTitle = () => {
        const now = new Date();
        const dateStr = format(now, 'MMM d, yyyy');
        const statusLabel =
            statusTabs.find((s) => s.value === status)?.label || status;
        return `${statusLabel} Follow-up - ${dateStr}`;
    };

    const handleOpenCreateTask = () => {
        setTaskTitle(generateTaskTitle());
        setCreateTaskDialog(true);
    };

    const handleCreateTask = async () => {
        if (!taskTitle.trim()) {
            toast.error('Please enter a task title');
            return;
        }
        if (!user?._id) {
            toast.error('Please login to create a task');
            return;
        }
        try {
            await createTask({
                title: taskTitle,
                type: 'telemarketing',
                assignedTo: user._id,
                leads: selectedLeads,
            }).unwrap();
            toast.success(`Task created with ${selectedLeads.length} leads`);
            setCreateTaskDialog(false);
            setTaskTitle('');
            exitSelectionMode();
        } catch (error) {
            toast.error(
                (error as { data?: { message?: string } })?.data?.message ||
                    'Failed to create task'
            );
        }
    };

    // Get scheduled date and next action from lead activities
    const getScheduleInfo = (lead: ILead) => {
        if (!lead.activities?.length) return { dueAt: null, nextAction: null };
        const latestActivity = lead.activities[0];
        return {
            dueAt: latestActivity?.dueAt || null,
            nextAction: latestActivity?.nextAction || null,
        };
    };

    // Pagination page numbers
    const getPageNumbers = () => {
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
        return pages;
    };

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Schedules</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
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

                {/* Filters Row - Select button moved here */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Select Leads Button - At start with filters */}
                    <Button
                        variant={selectionMode ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() =>
                            selectionMode
                                ? exitSelectionMode()
                                : setSelectionMode(true)
                        }
                        className="gap-2"
                    >
                        {selectionMode ? (
                            <>
                                <X className="h-4 w-4" />
                                Cancel ({selectedLeads.length})
                            </>
                        ) : (
                            <>
                                <CheckSquare className="h-4 w-4" />
                                Select
                            </>
                        )}
                    </Button>

                    <div className="w-px h-6 bg-border" />

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
                                    ? format(date, 'MMM d, yyyy')
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

                    <Select
                        value={String(perPage)}
                        onValueChange={(val) => setPerPage(Number(val))}
                    >
                        <SelectTrigger className="w-[100px]">
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

                    {/* Column Customizer */}
                    <ColumnCustomizerDialog page="schedules" />
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                {selectionMode && (
                                    <TableHead className="w-10 text-center">
                                        <Checkbox
                                            checked={
                                                selectedLeads.length ===
                                                    leads.length &&
                                                leads.length > 0
                                            }
                                            onCheckedChange={(checked) =>
                                                handleSelectAll(!!checked)
                                            }
                                        />
                                    </TableHead>
                                )}
                                <TableHead className="text-xs font-semibold w-[90px]">
                                    Due Date
                                </TableHead>
                                <TableHead className="text-xs font-semibold w-[80px]">
                                    Status
                                </TableHead>
                                {isColumnVisible('nextAction') && (
                                    <TableHead className="text-xs font-semibold w-[90px]">
                                        Next Action
                                    </TableHead>
                                )}
                                <TableHead className="text-xs font-semibold w-[130px]">
                                    Company
                                </TableHead>
                                {isColumnVisible('website') && (
                                    <TableHead className="text-xs font-semibold w-[110px]">
                                        Website
                                    </TableHead>
                                )}
                                {isColumnVisible('country') && (
                                    <TableHead className="text-xs font-semibold w-[90px]">
                                        Country
                                    </TableHead>
                                )}
                                {isColumnVisible('group') && (
                                    <TableHead className="text-xs font-semibold w-[90px]">
                                        Group
                                    </TableHead>
                                )}
                                {isColumnVisible('notes') && (
                                    <TableHead className="text-xs font-semibold w-[130px]">
                                        Notes
                                    </TableHead>
                                )}
                                {isColumnVisible('createdAt') && (
                                    <TableHead className="text-xs font-semibold w-[90px]">
                                        Created At
                                    </TableHead>
                                )}
                                {isColumnVisible('createdBy') && (
                                    <TableHead className="text-xs font-semibold w-[100px]">
                                        Created By
                                    </TableHead>
                                )}
                                {isColumnVisible('updatedAt') && (
                                    <TableHead className="text-xs font-semibold w-[90px]">
                                        Updated At
                                    </TableHead>
                                )}
                                {isColumnVisible('updatedBy') && (
                                    <TableHead className="text-xs font-semibold w-[100px]">
                                        Updated By
                                    </TableHead>
                                )}
                                <TableHead className="text-xs font-semibold w-[70px] text-center">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading || isFetching ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                        {Array.from({
                                            length: selectionMode ? 10 : 9,
                                        }).map((__, j) => (
                                            <TableCell key={j} className="py-3">
                                                <Skeleton className="h-4 w-full max-w-[80px] rounded-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : leads.length ? (
                                leads.map((lead: ILead) => {
                                    const { dueAt, nextAction } =
                                        getScheduleInfo(lead);
                                    const group = lead.group;
                                    const isSelected = selectedLeads.includes(
                                        lead._id
                                    );

                                    return (
                                        <TableRow
                                            key={lead._id}
                                            className={cn(
                                                'hover:bg-muted/50 transition-colors',
                                                selectionMode &&
                                                    isSelected &&
                                                    'bg-primary/5'
                                            )}
                                        >
                                            {selectionMode && (
                                                <TableCell className="py-2 text-center">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() =>
                                                            handleToggleLead(
                                                                lead._id
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell className="text-sm font-medium">
                                                {dueAt ? (
                                                    <span className="text-primary">
                                                        {format(
                                                            new Date(dueAt),
                                                            'MMM d'
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'capitalize text-[10px]',
                                                        lead.status ===
                                                            'interested' &&
                                                            'bg-green-50 text-green-700 border-green-200',
                                                        lead.status ===
                                                            'not-interested' &&
                                                            'bg-red-50 text-red-700 border-red-200',
                                                        lead.status ===
                                                            'test-trial' &&
                                                            'bg-purple-50 text-purple-700 border-purple-200',
                                                        lead.status ===
                                                            'call-back' &&
                                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    )}
                                                >
                                                    {lead.status.replace(
                                                        '-',
                                                        ' '
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            {isColumnVisible('nextAction') && (
                                                <TableCell className="text-xs capitalize">
                                                    {nextAction ? (
                                                        nextAction.replace(
                                                            '-',
                                                            ' '
                                                        )
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell className="text-sm truncate max-w-[130px]">
                                                <TooltipCell
                                                    value={lead.company.name}
                                                    className="font-medium max-w-[130px]"
                                                />
                                            </TableCell>
                                            {isColumnVisible('website') && (
                                                <TableCell className="text-sm truncate max-w-[110px]">
                                                    {lead.company.website ? (
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
                                                            className="text-blue-600 hover:underline truncate block max-w-[110px]"
                                                        >
                                                            {
                                                                lead.company
                                                                    .website
                                                            }
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {isColumnVisible('country') && (
                                                <TableCell className="text-sm truncate max-w-[90px]">
                                                    <TooltipCell
                                                        value={lead.country}
                                                        className="max-w-[90px]"
                                                    />
                                                </TableCell>
                                            )}
                                            {isColumnVisible('group') && (
                                                <TableCell className="text-sm truncate max-w-[90px]">
                                                    {group ? (
                                                        <div className="flex items-center gap-1">
                                                            <div
                                                                className="w-2 h-2 rounded-full shrink-0"
                                                                style={{
                                                                    backgroundColor:
                                                                        group.color ||
                                                                        '#6366f1',
                                                                }}
                                                            />
                                                            <span className="truncate text-xs">
                                                                {group.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {isColumnVisible('notes') && (
                                                <TableCell className="text-sm truncate max-w-[130px]">
                                                    <TooltipCell
                                                        value={
                                                            lead.activities?.[0]
                                                                ?.notes
                                                        }
                                                        className="max-w-[130px]"
                                                    />
                                                </TableCell>
                                            )}
                                            {isColumnVisible('createdAt') && (
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {lead.createdAt
                                                        ? new Date(
                                                              lead.createdAt
                                                          ).toLocaleDateString()
                                                        : '—'}
                                                </TableCell>
                                            )}
                                            {isColumnVisible('createdBy') && (
                                                <TableCell className="text-sm text-muted-foreground capitalize">
                                                    {(() => {
                                                        const creator =
                                                            lead.createdBy ||
                                                            (lead.owner as unknown as IUser);
                                                        return creator?.firstName
                                                            ? `${
                                                                  creator.firstName
                                                              } ${
                                                                  creator.lastName ||
                                                                  ''
                                                              }`
                                                            : '—';
                                                    })()}
                                                </TableCell>
                                            )}
                                            {isColumnVisible('updatedAt') && (
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {lead.updatedAt
                                                        ? new Date(
                                                              lead.updatedAt
                                                          ).toLocaleDateString()
                                                        : '—'}
                                                </TableCell>
                                            )}
                                            {isColumnVisible('updatedBy') && (
                                                <TableCell className="text-sm text-muted-foreground capitalize">
                                                    {lead.updatedBy?.firstName
                                                        ? `${
                                                              lead.updatedBy
                                                                  .firstName
                                                          } ${
                                                              lead.updatedBy
                                                                  .lastName ||
                                                              ''
                                                          }`
                                                        : '—'}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/leads/edit/${lead._id}`}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={selectionMode ? 10 : 9}
                                        className="text-center py-16 text-muted-foreground"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                                            <p>No scheduled follow-ups found</p>
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

                {/* Pagination - Same as Leads Page */}
                <div className="flex justify-between items-center pt-4">
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
                            className="gap-1 h-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        {/* Page Numbers */}
                        {getPageNumbers().map((p, idx) =>
                            p === '...' ? (
                                <span
                                    key={`ellipsis-${idx}`}
                                    className="px-2 text-muted-foreground"
                                >
                                    ...
                                </span>
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
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={
                                page === pagination.totalPages ||
                                pagination.totalPages === 0
                            }
                            onClick={() => setPage((p) => p + 1)}
                            className="gap-1 h-8"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Floating Action Bar */}
            {selectionMode && selectedLeads.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5" />
                            <span className="font-medium">
                                {selectedLeads.length} lead
                                {selectedLeads.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-primary-foreground/30" />
                        <Button
                            onClick={handleOpenCreateTask}
                            size="sm"
                            variant="secondary"
                            className="gap-2"
                        >
                            <ClipboardPlus className="h-4 w-4" />
                            Create Task
                        </Button>
                        <Button
                            onClick={() => setGroupDialog(true)}
                            size="sm"
                            variant="secondary"
                            className="gap-2"
                        >
                            <FolderPlus className="h-4 w-4" />
                            Change Group
                        </Button>
                        <Button
                            onClick={() => setBulkDeleteDialog(true)}
                            size="sm"
                            variant="secondary"
                            className="gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                        <Button
                            onClick={exitSelectionMode}
                            size="sm"
                            variant="ghost"
                            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Bulk Delete Dialog */}
            <AlertDialog
                open={bulkDeleteDialog}
                onOpenChange={setBulkDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {selectedLeads.length} Leads?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure? They will be moved to trash and can be
                            restored by an admin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isBulkDeleting}
                            onClick={handleBulkDelete}
                        >
                            {isBulkDeleting ? (
                                <Spinner className="h-4 w-4" />
                            ) : (
                                `Delete ${selectedLeads.length} Leads`
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Change Group Dialog */}
            <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Group</DialogTitle>
                        <DialogDescription>
                            Select a new group for {selectedLeads.length}{' '}
                            selected leads.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select
                            value={selectedGroupId}
                            onValueChange={setSelectedGroupId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <span className="text-muted-foreground">
                                        Remove from group
                                    </span>
                                </SelectItem>
                                {groups.map(
                                    (g: {
                                        _id: string;
                                        name: string;
                                        color?: string;
                                    }) => (
                                        <SelectItem key={g._id} value={g._id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            g.color ||
                                                            '#6366f1',
                                                    }}
                                                />
                                                {g.name}
                                            </div>
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setGroupDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleChangeGroup}
                            disabled={isChangingGroup || !selectedGroupId}
                        >
                            {isChangingGroup ? (
                                <Spinner className="h-4 w-4" />
                            ) : (
                                'Change Group'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Task Dialog */}
            <Dialog open={createTaskDialog} onOpenChange={setCreateTaskDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                        <DialogDescription>
                            Create a new task with {selectedLeads.length}{' '}
                            selected leads.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Task Title</Label>
                            <Input
                                placeholder="Enter task title..."
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateTaskDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTask}
                            disabled={isCreatingTask || !taskTitle.trim()}
                        >
                            {isCreatingTask ? (
                                <Spinner className="h-4 w-4" />
                            ) : (
                                'Create Task'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
