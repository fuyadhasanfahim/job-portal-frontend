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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import {
    useGetGroupsQuery,
    useCreateGroupMutation,
    useUpdateGroupMutation,
    usePermanentDeleteGroupMutation,
} from '@/redux/features/group/groupApi';
import type { IGroup } from '@/types/group.interface';

const colorPresets = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#64748b', // Slate
];

export default function GroupsPage() {
    const { data: groupsResponse, isLoading } = useGetGroupsQuery({ includeInactive: true });
    const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
    const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
    const [permanentDeleteGroup, { isLoading: isDeleting }] = usePermanentDeleteGroupMutation();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<IGroup | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<IGroup | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#6366f1',
        isActive: true,
    });

    const groups: IGroup[] = groupsResponse?.data || [];

    const resetForm = () => {
        setFormData({ name: '', description: '', color: '#6366f1', isActive: true });
        setEditingGroup(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEditDialog = (group: IGroup) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description || '',
            color: group.color || '#6366f1',
            isActive: group.isActive,
        });
        setDialogOpen(true);
    };

    const openDeleteDialog = (group: IGroup) => {
        setGroupToDelete(group);
        setDeleteDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Group name is required');
            return;
        }

        try {
            if (editingGroup) {
                await updateGroup({
                    id: editingGroup._id,
                    body: formData,
                }).unwrap();
                toast.success('Group updated successfully');
            } else {
                await createGroup(formData).unwrap();
                toast.success('Group created successfully');
            }
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error(
                (error as { data?: { message?: string } })?.data?.message ||
                'Failed to save group'
            );
        }
    };

    const handleDelete = async () => {
        if (!groupToDelete) return;

        try {
            await permanentDeleteGroup(groupToDelete._id).unwrap();
            toast.success(`Group "${groupToDelete.name}" deleted permanently`);
            setDeleteDialogOpen(false);
            setGroupToDelete(null);
        } catch (error) {
            toast.error(
                (error as { data?: { message?: string } })?.data?.message ||
                'Failed to delete group'
            );
        }
    };

    const handleToggleActive = async (group: IGroup) => {
        try {
            await updateGroup({
                id: group._id,
                body: { isActive: !group.isActive },
            }).unwrap();
            toast.success(
                `Group "${group.name}" ${!group.isActive ? 'activated' : 'deactivated'}`
            );
        } catch (error) {
            toast.error(
                (error as { data?: { message?: string } })?.data?.message ||
                'Failed to update group'
            );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading groups...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Groups Management</CardTitle>
                    <Button onClick={openCreateDialog}>
                        <IconPlus className="h-4 w-4 mr-2" />
                        New Group
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.length > 0 ? (
                                groups.map((group) => (
                                    <TableRow key={group._id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: group.color || '#6366f1' }}
                                                />
                                                {group.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                            {group.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {group.color || '#6366f1'}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={group.isActive}
                                                    onCheckedChange={() => handleToggleActive(group)}
                                                />
                                                <Badge
                                                    variant={group.isActive ? 'default' : 'secondary'}
                                                >
                                                    {group.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(group)}
                                                >
                                                    <IconEdit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openDeleteDialog(group)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <IconTrash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        No groups found. Create your first group to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingGroup ? 'Edit Group' : 'Create New Group'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingGroup
                                ? 'Update the group details below.'
                                : 'Fill in the details to create a new group.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="Enter group name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Enter group description"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {colorPresets.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color
                                            ? 'border-foreground scale-110'
                                            : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormData({ ...formData, color })}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) =>
                                        setFormData({ ...formData, color: e.target.value })
                                    }
                                    className="w-12 h-8 p-0 border-0"
                                />
                                <Input
                                    value={formData.color}
                                    onChange={(e) =>
                                        setFormData({ ...formData, color: e.target.value })
                                    }
                                    placeholder="#6366f1"
                                    className="w-28"
                                />
                            </div>
                        </div>
                        {editingGroup && (
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, isActive: checked })
                                    }
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreating || isUpdating}>
                                {isCreating || isUpdating ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group Permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete{' '}
                            <strong>&quot;{groupToDelete?.name}&quot;</strong>? This action
                            cannot be undone. Leads with this group will have their group
                            reference removed.
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
        </div>
    );
}
