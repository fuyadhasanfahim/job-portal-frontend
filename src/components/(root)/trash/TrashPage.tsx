'use client';

import React, { useState } from 'react';
import { useGetTrashedLeadsQuery, useRestoreLeadMutation, usePermanentDeleteLeadMutation } from '@/redux/features/trash/trashApi';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    IconRefresh,
    IconTrash,
    IconSearch,
    IconTrashX,
} from '@tabler/icons-react';
import { format } from 'date-fns';

interface TrashedLead {
    _id: string;
    originalLeadId: string;
    leadData: {
        company: { name: string; website?: string };
        country: string;
        contactPersons: { firstName?: string; lastName?: string; emails: string[] }[];
        status: string;
        owner?: { firstName: string; lastName?: string; email: string };
    };
    deletedBy: { firstName: string; lastName?: string; email: string };
    deletedAt: string;
    reason?: string;
}

export default function TrashPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        type: 'restore' | 'delete';
        id: string;
        name: string;
    }>({ open: false, type: 'restore', id: '', name: '' });

    const { data, isLoading, isFetching } = useGetTrashedLeadsQuery({
        page,
        limit: 10,
        search,
    });

    const [restoreLead, { isLoading: isRestoring }] = useRestoreLeadMutation();
    const [permanentDelete, { isLoading: isDeleting }] = usePermanentDeleteLeadMutation();

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const handleRestore = async () => {
        try {
            await restoreLead(confirmDialog.id).unwrap();
            toast.success(`Lead "${confirmDialog.name}" restored successfully`);
            setConfirmDialog({ open: false, type: 'restore', id: '', name: '' });
        } catch (error) {
            toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to restore lead');
        }
    };

    const handlePermanentDelete = async () => {
        try {
            await permanentDelete(confirmDialog.id).unwrap();
            toast.success(`Lead "${confirmDialog.name}" permanently deleted`);
            setConfirmDialog({ open: false, type: 'delete', id: '', name: '' });
        } catch (error) {
            toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to delete lead');
        }
    };

    const items = (data?.items || []) as TrashedLead[];
    const pagination = data?.pagination;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <IconTrashX className="text-muted-foreground" />
                            Trash
                        </CardTitle>
                        <CardDescription>
                            Deleted leads are stored here. Restore or permanently delete them.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Search */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1 max-w-sm">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search by company name..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-9"
                        />
                    </div>
                    <Button variant="outline" onClick={handleSearch}>
                        Search
                    </Button>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <IconTrash className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Trash is empty</p>
                    </div>
                ) : (
                    <>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Country</TableHead>
                                        <TableHead>Original Owner</TableHead>
                                        <TableHead>Deleted By</TableHead>
                                        <TableHead>Deleted At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item._id} className={isFetching ? 'opacity-50' : ''}>
                                            <TableCell>
                                                <div className="font-medium">{item.leadData.company.name}</div>
                                                {item.leadData.company.website && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {item.leadData.company.website}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{item.leadData.country}</TableCell>
                                            <TableCell>
                                                {item.leadData.owner ? (
                                                    <span>
                                                        {item.leadData.owner.firstName} {item.leadData.owner.lastName || ''}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    {item.deletedBy.firstName} {item.deletedBy.lastName || ''}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{item.deletedBy.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(item.deletedAt), 'MMM d, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setConfirmDialog({
                                                                open: true,
                                                                type: 'restore',
                                                                id: item._id,
                                                                name: item.leadData.company.name,
                                                            })
                                                        }
                                                    >
                                                        <IconRefresh className="w-4 h-4 mr-1" />
                                                        Restore
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            setConfirmDialog({
                                                                open: true,
                                                                type: 'delete',
                                                                id: item._id,
                                                                name: item.leadData.company.name,
                                                            })
                                                        }
                                                    >
                                                        <IconTrash className="w-4 h-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} items)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage((p) => p - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page >= pagination.totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* Confirm Dialog */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog.type === 'restore' ? 'Restore Lead?' : 'Permanently Delete?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.type === 'restore' ? (
                                <>
                                    This will restore the lead <strong>&quot;{confirmDialog.name}&quot;</strong> back to the leads list.
                                </>
                            ) : (
                                <>
                                    This will permanently delete <strong>&quot;{confirmDialog.name}&quot;</strong>. This action cannot be undone.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDialog.type === 'restore' ? handleRestore : handlePermanentDelete}
                            disabled={isRestoring || isDeleting}
                            className={confirmDialog.type === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
                        >
                            {isRestoring || isDeleting ? 'Processing...' : confirmDialog.type === 'restore' ? 'Restore' : 'Delete Forever'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
