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
import { ILead } from '@/types/lead.interface';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { Ellipsis } from 'lucide-react';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useDeleteLeadMutation } from '@/redux/features/lead/leadApi';
import { toast } from 'sonner';

export default function LeadsTable({
    leads,
    handleStatusSelect,
}: {
    leads: ILead[];
    handleStatusSelect: (lead: ILead) => void;
}) {
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        id: string;
        name: string;
    }>({ open: false, id: '', name: '' });

    const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();

    const handleDelete = async () => {
        try {
            await deleteLead({ id: deleteDialog.id }).unwrap();
            toast.success(`Lead "${deleteDialog.name}" deleted successfully`);
            setDeleteDialog({ open: false, id: '', name: '' });
        } catch (error) {
            toast.error(
                (error as { data?: { message?: string } })?.data?.message ||
                'Failed to delete lead'
            );
        }
    };

    return (
        <>
            <Table>
                <TableHeader className="bg-accent">
                    <TableRow>
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
                        <TableHead className="border text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.length ? (
                        leads.map((lead) => (
                            <TableRow key={lead._id}>
                                <TableCell className="border font-medium max-w-[200px] truncate">
                                    {lead.company.name}
                                </TableCell>

                                {/* Website */}
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

                                {/* Full Name */}
                                <TableCell className="border capitalize">
                                    {lead.contactPersons[0]?.firstName}{' '}
                                    {lead.contactPersons[0]?.lastName}
                                </TableCell>

                                {/* Emails */}
                                <TableCell className="border truncate max-w-[200px]">
                                    <div className="space-y-1">
                                        {lead.contactPersons?.flatMap((cp, ci) =>
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

                                {/* Phones */}
                                <TableCell className="border truncate max-w-[200px]">
                                    <div className="space-y-1">
                                        {lead.contactPersons?.flatMap((cp, ci) =>
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

                                {/* Designation */}
                                <TableCell className="border truncate max-w-[200px] capitalize">
                                    {lead.contactPersons[0]?.designation || 'N/A'}
                                </TableCell>

                                {/* Address */}
                                <TableCell className="border max-w-[200px] truncate capitalize">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="block max-w-[200px] truncate cursor-help">
                                                {lead.address || 'N/A'}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-sm break-words">
                                            {lead.address || 'N/A'}
                                        </TooltipContent>
                                    </Tooltip>
                                </TableCell>

                                {/* Country */}
                                <TableCell className="border capitalize">
                                    {lead.country || 'N/A'}
                                </TableCell>

                                {/* Status */}
                                <TableCell className="border capitalize">
                                    {lead.status.replace('_', ' ')}
                                </TableCell>

                                {/* notes */}
                                <TableCell className="border max-w-[200px] truncate">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="block max-w-[200px] truncate cursor-help">
                                                {lead.activities?.[0]?.notes ||
                                                    'N/A'}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-sm break-words">
                                            {lead.activities?.[0]?.notes || 'N/A'}
                                        </TooltipContent>
                                    </Tooltip>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="border text-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Ellipsis className="h-5 w-5 text-gray-600" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-36"
                                        >
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleStatusSelect(lead)
                                                }
                                            >
                                                <IconEdit className="h-4 w-4" />
                                                Update Status
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
                                                <IconTrash className="h-4 w-4 text-destructive" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={11}
                                className="text-center py-10 text-gray-500 border"
                            >
                                No leads found for this task.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

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
                            This lead will be moved to trash and can be restored
                            by an admin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                            onClick={handleDelete}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
