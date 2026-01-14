'use client';

import React, { FormEvent, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
    useGetTaskByIdQuery,
    useUpdateTaskWithLeadMutation,
    useForceCompleteTaskMutation,
} from '@/redux/features/task/taskApi';
import { ITask } from '@/types/task.interface';
import { ILead, IActivity } from '@/types/lead.interface';
import { useSignedUser } from '@/hooks/useSignedUser';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDownIcon, CheckCircle2, ClipboardList } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import LeadsTable from './LeadsTable';
import { cn } from '@/lib/utils';

// Lead status options
const LEAD_STATUS = [
    'new',
    'answering-machine',
    'interested',
    'not-interested',
    'call-back',
    'test-trial',
    'on-board',
    'language-barrier',
    'invalid-number',
];

export default function RootTaskDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useSignedUser();

    const [selectedLead, setSelectedLead] = useState<ILead | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [open, setOpen] = useState(false);

    const [activityData, setActivityData] = useState<Partial<IActivity>>({
        status: 'new',
        notes: '',
        nextAction: undefined,
        dueAt: undefined,
    });

    const { data, isLoading } = useGetTaskByIdQuery(id, {
        skip: !id,
        refetchOnMountOrArgChange: false,
    });
    const [updateTaskWithLead, { isLoading: isUpdating }] =
        useUpdateTaskWithLeadMutation();
    const [forceCompleteTask, { isLoading: isForceCompleting }] =
        useForceCompleteTaskMutation();

    const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
    const task: ITask | null = data?.task ?? null;
    const leads: ILead[] = data?.leads ?? [];

    const handleOpenDialog = (lead: ILead) => {
        setSelectedLead(lead);

        // Get latest activity to pre-fill data
        const latestActivity =
            lead.activities && lead.activities.length > 0
                ? lead.activities[lead.activities.length - 1]
                : null;

        setActivityData({
            status: lead.status, // Pre-fill current status
            notes: '', // Notes are usually new for the update
            nextAction: latestActivity?.nextAction, // Pre-fill last next action
            dueAt: latestActivity?.dueAt
                ? new Date(latestActivity.dueAt)
                : undefined, // Pre-fill last due date
        });

        setIsDialogOpen(true);
    };

    const handleStatusUpdate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedLead || !task || !activityData.status) {
            toast.error('Please select a status before saving.');
            return;
        }

        // Validation: Due Date is mandatory if Next Action is selected
        if (activityData.nextAction && !activityData.dueAt) {
            toast.error('Due Date is required when Next Action is selected.');
            return;
        }

        try {
            const res = await updateTaskWithLead({
                taskId: task._id,
                leadId: selectedLead._id,
                body: {
                    leadUpdates: { status: activityData.status },
                    activity: {
                        status: activityData.status,
                        notes: activityData.notes,
                        nextAction: activityData.nextAction,
                        dueAt: activityData.dueAt,
                        byUser: user?._id as string,
                        at: new Date(),
                    },
                },
            }).unwrap();

            if (res.success) {
                toast.success(
                    res.message || 'Lead and activity updated successfully!'
                );
                setIsDialogOpen(false);
                setActivityData({
                    status: 'new',
                    notes: '',
                    nextAction: undefined,
                    dueAt: undefined,
                });
            }
        } catch (error) {
            console.error(error);
            toast.error(
                (error as Error).message || 'Failed to update lead and task.'
            );
        }
    };

    if (isLoading && !task)
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );

    const handleForceComplete = async () => {
        if (!task || !id) return;
        try {
            const res = await forceCompleteTask({ taskId: id }).unwrap();
            if (res.success) {
                toast.success('Task force completed successfully');
            }
        } catch (error) {
            toast.error(
                (error as Error).message || 'Failed to force complete task'
            );
        }
    };

    if (!task)
        return <div className="p-6 text-muted-foreground">Task not found.</div>;

    return (
        <div className="space-y-6">
            {/* Task Info Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                {task.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground capitalize">
                                {task.type.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                    {isAdmin && task.status !== 'completed' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleForceComplete}
                            disabled={isForceCompleting}
                            className="gap-2"
                        >
                            {isForceCompleting ? (
                                <Spinner className="h-4 w-4" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Force Complete
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-0">
                    {/* Status */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge
                            className={cn(
                                'capitalize',
                                task.status === 'completed' &&
                                    'bg-green-100 text-green-700 border-green-200',
                                task.status === 'in_progress' &&
                                    'bg-blue-100 text-blue-700 border-blue-200',
                                task.status === 'pending' &&
                                    'bg-yellow-100 text-yellow-700 border-yellow-200',
                                task.status === 'cancelled' &&
                                    'bg-red-100 text-red-700 border-red-200'
                            )}
                        >
                            {task.status.replace('_', ' ')}
                        </Badge>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                            Progress
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                                <div
                                    className={cn(
                                        'h-full transition-all',
                                        task.progress === 100
                                            ? 'bg-green-500'
                                            : 'bg-primary'
                                    )}
                                    style={{ width: `${task.progress ?? 0}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium">
                                {task.progress ?? 0}%
                            </span>
                        </div>
                    </div>

                    {/* Assigned To */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                            Assigned To
                        </p>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage
                                    src={task.assignedTo?.image || ''}
                                />
                                <AvatarFallback className="text-xs">
                                    {task.assignedTo?.firstName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                                {task.assignedTo?.firstName}{' '}
                                {task.assignedTo?.lastName}
                            </span>
                        </div>
                    </div>

                    {/* Created By */}
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                            Created By
                        </p>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage
                                    src={task.createdBy?.image || ''}
                                />
                                <AvatarFallback className="text-xs">
                                    {task.createdBy?.firstName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                                {task.createdBy?.firstName}{' '}
                                {task.createdBy?.lastName}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 🧩 Leads */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CardTitle>Leads ({leads.length})</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                {task?.completedLeads?.length || 0} completed
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                                {leads.length -
                                    (task?.completedLeads?.length || 0)}{' '}
                                pending
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <LeadsTable
                        leads={leads}
                        handleStatusSelect={handleOpenDialog}
                    />
                </CardContent>
            </Card>

            {/* 🗒️ Activity Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Update Lead Status</DialogTitle>
                        <DialogDescription>
                            Provide update for{' '}
                            <strong>{selectedLead?.company.name}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        action="#"
                        className="grid grid-cols-2 gap-4 pt-4"
                        onSubmit={handleStatusUpdate}
                    >
                        {/* 🟢 Status */}
                        <div className="space-y-3">
                            <Label>Status *</Label>
                            <Select
                                value={activityData.status || ''}
                                onValueChange={(v) =>
                                    setActivityData((p) => ({
                                        ...p,
                                        status: v as IActivity['status'],
                                    }))
                                }
                            >
                                <SelectTrigger className="w-full capitalize">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEAD_STATUS.map((s) => (
                                        <SelectItem
                                            key={s}
                                            value={s}
                                            className="capitalize"
                                        >
                                            {s.replace(/-/g, ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 🧭 Next Action */}
                        <div className="space-y-3">
                            <Label>Next Action</Label>
                            <Select
                                value={activityData.nextAction || ''}
                                onValueChange={(v) =>
                                    setActivityData((p) => ({
                                        ...p,
                                        nextAction:
                                            v as IActivity['nextAction'],
                                    }))
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select next action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="follow-up">
                                        Follow Up
                                    </SelectItem>
                                    <SelectItem value="send-proposal">
                                        Send Proposal
                                    </SelectItem>
                                    <SelectItem value="call-back">
                                        Call Back
                                    </SelectItem>
                                    <SelectItem value="close">Close</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 📅 Due Date */}
                        <div className="flex flex-col gap-3">
                            <Label>Due Date</Label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="justify-between"
                                    >
                                        {activityData.dueAt
                                            ? format(activityData.dueAt, 'PPP')
                                            : 'Select date'}
                                        <ChevronDownIcon />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={activityData.dueAt}
                                        onSelect={(date) => {
                                            setActivityData((p) => ({
                                                ...p,
                                                dueAt: date,
                                            }));
                                            setOpen(false);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* 📝 Notes */}
                        <div className="col-span-2 space-y-3">
                            <Label>Notes</Label>
                            <Textarea
                                rows={3}
                                placeholder="Add notes about this interaction..."
                                value={activityData.notes || ''}
                                onChange={(e) =>
                                    setActivityData((p) => ({
                                        ...p,
                                        notes: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <DialogFooter className="col-span-2 mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? <Spinner /> : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
