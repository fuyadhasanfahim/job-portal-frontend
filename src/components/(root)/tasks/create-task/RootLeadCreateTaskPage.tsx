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
import { Label } from '@/components/ui/label';
import { ChevronDownIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCountriesQuery } from '@/redux/features/country/countryApi';
import { useGetLeadsQuery } from '@/redux/features/lead/leadApi';
import { useCreateTaskMutation } from '@/redux/features/task/taskApi';
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
import { UserFilterSelects } from '@/components/shared/UserFilterSelects';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SortOption = 'companyAsc' | 'companyDesc' | 'countryAsc' | 'countryDesc';

const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'busy', label: 'Busy' },
    { value: 'answering-machine', label: 'Answering Machine' },
    { value: 'interested', label: 'Interested' },
    { value: 'not-interested', label: 'Not Interested' },
    { value: 'test-trial', label: 'Test Trial' },
    { value: 'call-back', label: 'Call Back' },
    { value: 'on-board', label: 'On Board' },
    { value: 'invalid-number', label: 'Invalid Number' },
];

export default function RootLeadCreateTaskPage() {
    const { user } = useSignedUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

    const [selectedRole, setSelectedRole] = useState('all-role');
    const [selectedUserId, setSelectedUserId] = useState('all-user');
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [countryFilter, setCountryFilter] = useState('all');
    const [status, setStatus] = useState('all');
    const [sort, setSort] = useState<SortOption>('companyAsc');
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);

    const { data: countries } = useGetCountriesQuery({});

    const {
        data,
        isLoading: leadsLoading,
        isFetching,
    } = useGetLeadsQuery({
        page,
        limit: perPage,
        country: countryFilter,
        sortBy: sort.includes('company') ? 'company.name' : 'country',
        sortOrder: sort.endsWith('Asc') ? 'asc' : 'desc',
        status,
        date: date ? date.toLocaleDateString('en-CA') : '',
        selectedUserId,
    });

    const leads = data?.data ?? [];
    const pagination = data?.pagination ?? { totalItems: 0, totalPages: 1 };
    const [createTask, { isLoading: creating }] = useCreateTaskMutation();

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
        const assignedUserId = isAdmin ? selectedUserId : user?._id;

        if (!assignedUserId) return toast.error('Please select a user');
        if (selectedLeads.length === 0)
            return toast.error('Please select at least one lead');

        try {
            const res = await createTask({
                title: `Lead Assignment - ${new Date().toLocaleDateString()}`,
                description: `Lead generation task assigned to ${assignedUserId}`,
                type: 'cold_call',
                quantity: selectedLeads.length,
                assignedTo: assignedUserId,
                leads: selectedLeads,
            }).unwrap();

            toast.success(res.message || 'Task created successfully!');
            setSelectedLeads([]);
            if (isAdmin) setSelectedUserId('');
        } catch (err) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ??
                'Failed to create task';
            toast.error(message);
        }
    };

    // ------------------ UI ------------------
    return (
        <div className="p-6 space-y-6 rounded-lg border bg-card">
            <h2 className="text-xl font-semibold">
                Create Lead Generation Task
            </h2>

            {/* ✅ Tabs for status filter */}
            <Tabs
                value={status}
                onValueChange={(val) => {
                    setStatus(val);
                    setPage(1);
                }}
                className="w-full"
            >
                <TabsList className="flex flex-wrap gap-2">
                    {statusTabs.map((s) => (
                        <TabsTrigger
                            key={s.value}
                            value={s.value}
                            className="capitalize"
                        >
                            {s.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Filters */}
            <div className="flex items-end justify-end gap-4">
                {/* Role & User (only visible to admin/super-admin) */}
                {isAdmin ? (
                    <div className="w-full max-w-5xl">
                        <UserFilterSelects
                            selectedRole={selectedRole}
                            setSelectedRole={setSelectedRole}
                            selectedUserId={selectedUserId}
                            setSelectedUserId={setSelectedUserId}
                        />
                    </div>
                ) : (
                    <Input
                        type="hidden"
                        value={user?._id}
                        onChange={() => {}}
                    />
                )}

                {/* Country */}
                <div className="grid gap-2">
                    <Label htmlFor="country-select">Country</Label>
                    <Select
                        value={countryFilter}
                        onValueChange={setCountryFilter}
                    >
                        <SelectTrigger
                            id="country-select"
                            className="w-full capitalize"
                        >
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
                </div>

                {/* Date */}
                <div className="grid gap-2">
                    <Label htmlFor="date" className="px-1">
                        Date
                    </Label>
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
                </div>

                {/* Sort */}
                <div className="grid gap-2">
                    <Label htmlFor="sort-select">Sort</Label>
                    <Select
                        value={sort}
                        onValueChange={(val) => setSort(val as SortOption)}
                    >
                        <SelectTrigger id="sort-select" className="w-full">
                            <SelectValue placeholder="Sort by" />
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
                </div>

                {/* Per Page */}
                <div className="grid gap-2">
                    <Label htmlFor="perpage-select">Per Page</Label>
                    <Select
                        value={String(perPage)}
                        onValueChange={(val) => setPerPage(Number(val))}
                    >
                        <SelectTrigger id="perpage-select" className="w-full">
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
                </div>
            </div>

            {/* Table */}
            <Table>
                <TableHeader className="bg-muted">
                    <TableRow>
                        <TableHead className="w-12 text-center border">
                            <Checkbox
                                checked={
                                    selectedLeads.length === leads.length &&
                                    leads.length > 0
                                }
                                onCheckedChange={(checked) =>
                                    handleSelectAll(!!checked)
                                }
                                aria-label="Select all leads"
                            />
                        </TableHead>
                        <TableHead className="border">Company</TableHead>
                        <TableHead className="border">Website</TableHead>
                        <TableHead className="border">Full Name</TableHead>
                        <TableHead className="border">Emails</TableHead>
                        <TableHead className="border">Phones</TableHead>
                        <TableHead className="border">Designation</TableHead>
                        <TableHead className="border">Address</TableHead>
                        <TableHead className="border">Country</TableHead>
                        <TableHead className="border">Status</TableHead>
                        <TableHead className="border">Notes</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {leadsLoading || isFetching ? (
                        Array.from({ length: perPage }).map((_, i) => (
                            <TableRow key={i}>
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <TableCell key={j} className="border">
                                        <Skeleton className="h-4 w-24 mx-auto" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : leads.length ? (
                        leads.map((lead: ILead) => (
                            <TableRow key={lead._id}>
                                <TableCell className="text-center border">
                                    <Checkbox
                                        checked={selectedLeads.includes(
                                            lead._id
                                        )}
                                        onCheckedChange={() =>
                                            handleToggleLead(lead._id)
                                        }
                                        aria-label={`Select ${lead.company.name}`}
                                    />
                                </TableCell>
                                <TableCell className="border font-medium max-w-[200px] truncate">
                                    {lead.company.name}
                                </TableCell>
                                <TableCell className="border text-blue-600 underline max-w-[200px] truncate">
                                    {lead.company.website ? (
                                        <Link
                                            href={
                                                lead.company.website.startsWith(
                                                    'http'
                                                )
                                                    ? lead.company.website
                                                    : `https://${lead.company.website}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-blue-700"
                                        >
                                            {lead.company.website}
                                        </Link>
                                    ) : (
                                        'N/A'
                                    )}
                                </TableCell>
                                <TableCell className="border capitalize">
                                    {lead.contactPersons[0]?.firstName}{' '}
                                    {lead.contactPersons[0]?.lastName}
                                </TableCell>
                                <TableCell className="border truncate max-w-[200px]">
                                    <div className="space-y-1">
                                        {lead.contactPersons?.flatMap(
                                            (cp, ci) =>
                                                cp.emails?.map((email, ei) => (
                                                    <p
                                                        key={`cp-email-${lead._id}-${ci}-${ei}`}
                                                    >
                                                        {email}
                                                    </p>
                                                ))
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="border truncate max-w-[200px]">
                                    <div className="space-y-1">
                                        {lead.contactPersons?.flatMap(
                                            (cp, ci) =>
                                                cp.phones?.map((phone, pi) => (
                                                    <p
                                                        key={`cp-phone-${lead._id}-${ci}-${pi}`}
                                                    >
                                                        {phone}
                                                    </p>
                                                ))
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="border truncate max-w-[200px] capitalize">
                                    {lead.contactPersons[0]?.designation ||
                                        'N/A'}
                                </TableCell>
                                <TableCell className="border max-w-[200px] truncate capitalize">
                                    {lead.address || 'N/A'}
                                </TableCell>
                                <TableCell className="border capitalize">
                                    {lead.country || 'N/A'}
                                </TableCell>
                                <TableCell className="border capitalize">
                                    {lead.status.replace('_', ' ')}
                                </TableCell>
                                <TableCell className="border capitalize truncate max-w-[200px]">
                                    {(lead.activities &&
                                        lead.activities[0]?.notes) ||
                                        'N/A'}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={12}
                                className="text-center py-12 text-muted-foreground border"
                            >
                                No new leads found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
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
                        <>No leads to display</>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
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
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Create Task */}
            <div className="pt-4 border-t">
                <Button
                    onClick={handleCreateTask}
                    disabled={
                        creating ||
                        (!isAdmin && !user?._id) ||
                        (isAdmin && !selectedUserId) ||
                        selectedLeads.length === 0
                    }
                    size="lg"
                >
                    {creating ? <Spinner /> : 'Create Task'}
                </Button>
            </div>
        </div>
    );
}
