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
import { ChevronDownIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import LeadsTable from './LeadsTable';

// Lead status options
const LEAD_STATUS = [
    'new',
    'busy',
    'answering-machine',
    'interested',
    'not-interested',
    'call-back',
    'test-trial',
    'on-board',
    'no-answer',
    'email/whatsApp-sent',
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

    const task: ITask | null = data?.task ?? null;
    const leads: ILead[] = data?.leads ?? [];

    const handleOpenDialog = (lead: ILead) => {
        setSelectedLead(lead);
        setIsDialogOpen(true);
    };

    const handleStatusUpdate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedLead || !task || !activityData.status) {
            toast.error('Please select a status before saving.');
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

    if (!task)
        return <div className="p-6 text-muted-foreground">Task not found.</div>;

    return (
        <div className="space-y-6">
            {/* 🟦 Task Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Task Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm p-4">
                    <div className="space-y-2">
                        <p>
                            <strong>Title:</strong> {task.title}
                        </p>
                        <p>
                            <strong>Type:</strong> {task.type}
                        </p>
                        <p>
                            <strong>Status:</strong>
                            <Badge className="ml-2 capitalize">
                                {task.status.replace('_', ' ')}
                            </Badge>
                        </p>
                        <p>
                            <strong>Progress:</strong> {task.progress ?? 0}%
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src={task.assignedTo?.image || ''}
                                />
                                <AvatarFallback>
                                    {task.assignedTo?.firstName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">
                                    Assigned To
                                </p>
                                <p className="text-sm text-gray-700">
                                    {task.assignedTo?.firstName}{' '}
                                    {task.assignedTo?.lastName}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src={task.createdBy?.image || ''}
                                />
                                <AvatarFallback>
                                    {task.createdBy?.firstName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">
                                    Created By
                                </p>
                                <p className="text-sm text-gray-700">
                                    {task.createdBy?.firstName}{' '}
                                    {task.createdBy?.lastName}
                                </p>
                            </div>
                        </div>

                        <div className="text-sm space-y-1">
                            <p>
                                <strong>Created At:</strong>{' '}
                                {format(task.createdAt, 'PPP')}
                            </p>
                            {task.finishedAt && (
                                <p>
                                    <strong>Finished At:</strong>{' '}
                                    {format(task.finishedAt, 'PPP')}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 🧩 Leads */}
            <Card>
                <CardHeader>
                    <CardTitle>Leads ({leads.length})</CardTitle>
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
