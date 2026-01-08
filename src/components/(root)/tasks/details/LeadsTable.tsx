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
    TooltipProvider,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Ellipsis, CheckSquare, X, FolderPlus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { 
    useDeleteLeadMutation, 
    useBulkDeleteLeadsMutation, 
    useBulkChangeGroupMutation 
} from '@/redux/features/lead/leadApi';
import { useGetGroupsQuery } from '@/redux/features/group/groupApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Copy text helper
const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
};

// Tooltip cell component with copy
const TooltipCell = ({ 
    value, 
    className,
    maxWidth = "max-w-[120px]" 
}: { 
    value?: string | null; 
    className?: string;
    maxWidth?: string;
}) => {
    if (!value) return <span className="text-muted-foreground">—</span>;
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span 
                        className={cn(
                            "cursor-pointer hover:text-primary transition-colors truncate block",
                            maxWidth,
                            className
                        )}
                        onClick={() => copyToClipboard(value)}
                    >
                        {value}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs break-all">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to copy</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

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

    // Selection mode state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    
    // Bulk delete dialog
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
    
    // Change group dialog
    const [groupDialog, setGroupDialog] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');

    // API hooks
    const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();
    const [bulkDeleteLeads, { isLoading: isBulkDeleting }] = useBulkDeleteLeadsMutation();
    const [bulkChangeGroup, { isLoading: isChangingGroup }] = useBulkChangeGroupMutation();
    const { data: groupsData } = useGetGroupsQuery({});
    const groups = groupsData?.data ?? [];

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

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedLeads(leads.map(lead => lead._id));
        } else {
            setSelectedLeads([]);
        }
    };

    const handleToggleLead = (id: string) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedLeads([]);
    };

    const handleBulkDelete = async () => {
        try {
            const result = await bulkDeleteLeads({ leadIds: selectedLeads }).unwrap();
            toast.success(result.message || `${result.successCount} leads deleted`);
            setBulkDeleteDialog(false);
            exitSelectionMode();
        } catch (error) {
            toast.error(
                (error as { data?: { message?: string } })?.data?.message ||
                'Failed to delete leads'
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
                targetGroupId: selectedGroupId === 'none' ? null : selectedGroupId 
            }).unwrap();
            toast.success(result.message || `Group changed for ${result.success} leads`);
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

    return (
        <>
            {/* Selection Mode Toggle */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                    {selectionMode && selectedLeads.length > 0 && (
                        <span>{selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected</span>
                    )}
                </div>
                <Button
                    variant={selectionMode ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
                    className="gap-2"
                >
                    {selectionMode ? (
                        <>
                            <X className="h-4 w-4" />
                            Cancel
                        </>
                    ) : (
                        <>
                            <CheckSquare className="h-4 w-4" />
                            Select Leads
                        </>
                    )}
                </Button>
            </div>

            {/* Table without overflow-x */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            {selectionMode && (
                                <TableHead className="w-10 text-center">
                                    <Checkbox
                                        checked={selectedLeads.length === leads.length && leads.length > 0}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                    />
                                </TableHead>
                            )}
                            <TableHead className="text-xs font-semibold w-[130px]">Company</TableHead>
                            <TableHead className="text-xs font-semibold w-[100px]">Website</TableHead>
                            <TableHead className="text-xs font-semibold w-[110px]">Full Name</TableHead>
                            <TableHead className="text-xs font-semibold w-[130px]">Email</TableHead>
                            <TableHead className="text-xs font-semibold w-[100px]">Phone</TableHead>
                            <TableHead className="text-xs font-semibold w-[90px]">Designation</TableHead>
                            <TableHead className="text-xs font-semibold w-[80px]">Country</TableHead>
                            <TableHead className="text-xs font-semibold w-[80px]">Group</TableHead>
                            <TableHead className="text-xs font-semibold w-[80px]">Status</TableHead>
                            <TableHead className="text-xs font-semibold w-[100px]">Notes</TableHead>
                            <TableHead className="text-xs font-semibold w-[50px] text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.length ? (
                            leads.map((lead) => {
                                const contact = lead.contactPersons?.[0];
                                const fullName = contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() : '';
                                const email = contact?.emails?.[0];
                                const phone = contact?.phones?.[0];
                                const isSelected = selectedLeads.includes(lead._id);
                                
                                return (
                                    <TableRow 
                                        key={lead._id} 
                                        className={cn(
                                            "hover:bg-muted/50 transition-colors",
                                            selectionMode && isSelected && "bg-primary/5"
                                        )}
                                    >
                                        {selectionMode && (
                                            <TableCell className="py-2 text-center">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleToggleLead(lead._id)}
                                                />
                                            </TableCell>
                                        )}
                                        
                                        {/* Company */}
                                        <TableCell className="py-2">
                                            <TooltipCell value={lead.company.name} className="font-medium" maxWidth="max-w-[130px]" />
                                        </TableCell>

                                        {/* Website */}
                                        <TableCell className="py-2">
                                            {lead.company.website ? (
                                                <Link
                                                    href={lead.company.website.startsWith('http') ? lead.company.website : `https://${lead.company.website}`}
                                                    target="_blank"
                                                    className="text-blue-600 hover:underline truncate block max-w-[100px]"
                                                >
                                                    {lead.company.website}
                                                </Link>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </TableCell>

                                        {/* Full Name */}
                                        <TableCell className="py-2 capitalize">
                                            <TooltipCell value={fullName || null} maxWidth="max-w-[110px]" />
                                        </TableCell>

                                        {/* Email */}
                                        <TableCell className="py-2">
                                            <TooltipCell value={email} maxWidth="max-w-[130px]" />
                                        </TableCell>

                                        {/* Phone */}
                                        <TableCell className="py-2">
                                            <TooltipCell value={phone} maxWidth="max-w-[100px]" />
                                        </TableCell>

                                        {/* Designation */}
                                        <TableCell className="py-2 capitalize">
                                            <TooltipCell value={contact?.designation} maxWidth="max-w-[90px]" />
                                        </TableCell>

                                        {/* Country */}
                                        <TableCell className="py-2 capitalize">
                                            <TooltipCell value={lead.country} maxWidth="max-w-[80px]" />
                                        </TableCell>

                                        {/* Group */}
                                        <TableCell className="py-2">
                                            {lead.group ? (
                                                <div className="flex items-center gap-1 max-w-[80px]">
                                                    <div
                                                        className="w-2 h-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: lead.group.color || '#6366f1' }}
                                                    />
                                                    <span className="truncate text-xs">{lead.group.name}</span>
                                                </div>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="py-2">
                                            <Badge variant="outline" className={cn(
                                                "capitalize text-[10px]",
                                                lead.status === 'new' && "bg-blue-50 text-blue-700 border-blue-200",
                                                lead.status === 'interested' && "bg-green-50 text-green-700 border-green-200",
                                                lead.status === 'not-interested' && "bg-red-50 text-red-700 border-red-200",
                                                lead.status === 'call-back' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                                                lead.status === 'test-trial' && "bg-purple-50 text-purple-700 border-purple-200"
                                            )}>
                                                {lead.status.replace(/-/g, ' ')}
                                            </Badge>
                                        </TableCell>

                                        {/* Notes */}
                                        <TableCell className="py-2">
                                            <TooltipCell value={lead.activities?.[0]?.notes} maxWidth="max-w-[100px]" />
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="py-2 text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <Ellipsis className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem asChild>
                                                        <Link 
                                                            href={`/leads/edit/${lead._id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <IconEdit className="h-4 w-4" />
                                                            Edit Lead
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusSelect(lead)}>
                                                        <IconEdit className="h-4 w-4" />
                                                        Update Status
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeleteDialog({
                                                            open: true,
                                                            id: lead._id,
                                                            name: lead.company.name,
                                                        })}
                                                    >
                                                        <IconTrash className="h-4 w-4" />
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
                                <TableCell colSpan={selectionMode ? 12 : 11} className="text-center py-12 text-muted-foreground">
                                    No leads found for this task.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Floating Action Bar for Selection Mode */}
            {selectionMode && selectedLeads.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="flex items-center gap-4 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5" />
                            <span className="font-medium">
                                {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <div className="w-px h-6 bg-primary-foreground/30" />
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

            {/* Single Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>&quot;{deleteDialog.name}&quot;</strong>?
                            This lead will be moved to trash and can be restored by an admin.
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

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedLeads.length} Leads?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedLeads.length} selected leads?
                            They will be moved to trash and can be restored by an admin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isBulkDeleting}
                            onClick={handleBulkDelete}
                        >
                            {isBulkDeleting ? <Spinner className="h-4 w-4" /> : `Delete ${selectedLeads.length} Leads`}
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
                            Select a new group for {selectedLeads.length} selected leads.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <span className="text-muted-foreground">Remove from group</span>
                                </SelectItem>
                                {groups.map((g: { _id: string; name: string; color?: string }) => (
                                    <SelectItem key={g._id} value={g._id}>
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: g.color || '#6366f1' }} 
                                            />
                                            {g.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGroupDialog(false)}>Cancel</Button>
                        <Button onClick={handleChangeGroup} disabled={isChangingGroup || !selectedGroupId}>
                            {isChangingGroup ? <Spinner className="h-4 w-4" /> : 'Change Group'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
