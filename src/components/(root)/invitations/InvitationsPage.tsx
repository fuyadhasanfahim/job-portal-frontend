'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    useCreateInvitationMutation,
    useGetInvitationsQuery,
    useRevokeInvitationMutation,
    useResendInvitationMutation,
} from '@/redux/features/invitation/invitationApi';
import { toast } from 'sonner';
import { IconLoader2, IconCopy, IconTrash, IconRefresh, IconUserPlus } from '@tabler/icons-react';
import { format } from 'date-fns';
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

const ROLES = [
    { value: 'admin', label: 'Admin' },
    { value: 'telemarketer', label: 'Telemarketer' },
    { value: 'digital-marketer', label: 'Digital Marketer' },
    { value: 'seo-executive', label: 'SEO Executive' },
    { value: 'social-media-executive', label: 'Social Media Executive' },
    { value: 'web-developer', label: 'Web Developer' },
    { value: 'photo-editor', label: 'Photo Editor' },
    { value: 'graphic-designer', label: 'Graphic Designer' },
];

export default function InvitationsPage() {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null);

    const { data: invitationsData, isLoading } = useGetInvitationsQuery({});
    const [createInvitation, { isLoading: isCreating }] = useCreateInvitationMutation();
    const [revokeInvitation, { isLoading: isRevoking }] = useRevokeInvitationMutation();
    const [resendInvitation, { isLoading: isResending }] = useResendInvitationMutation();

    const handleCreateInvitation = async () => {
        if (!email || !role) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const result = await createInvitation({ email, role }).unwrap();
            toast.success('Invitation created successfully!');

            // Copy invite link to clipboard
            const inviteUrl = `${window.location.origin}/sign-up?token=${result.invitation.token}`;
            await navigator.clipboard.writeText(inviteUrl);
            toast.success('Invite link copied to clipboard!');

            setEmail('');
            setRole('');
        } catch (error) {
            toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to create invitation');
        }
    };

    const handleCopyLink = async (token: string) => {
        const inviteUrl = `${window.location.origin}/sign-up?token=${token}`;
        await navigator.clipboard.writeText(inviteUrl);
        toast.success('Invite link copied to clipboard!');
    };

    const handleRevoke = async () => {
        if (!selectedInvitationId) return;
        try {
            await revokeInvitation(selectedInvitationId).unwrap();
            toast.success('Invitation revoked');
            setRevokeDialogOpen(false);
            setSelectedInvitationId(null);
        } catch (error) {
            toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to revoke invitation');
        }
    };

    const handleResend = async (id: string) => {
        try {
            const result = await resendInvitation(id).unwrap();
            toast.success('Invitation resent successfully!');

            // Copy new invite link
            const inviteUrl = `${window.location.origin}/sign-up?token=${result.invitation.token}`;
            await navigator.clipboard.writeText(inviteUrl);
            toast.success('New invite link copied to clipboard!');
        } catch (error) {
            toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to resend invitation');
        }
    };

    const getStatusBadge = (status: string, expiresAt: string) => {
        const isExpired = new Date() > new Date(expiresAt);

        if (status === 'used') {
            return <Badge variant="default" className="bg-green-500">Used</Badge>;
        }
        if (status === 'revoked') {
            return <Badge variant="destructive">Revoked</Badge>;
        }
        if (isExpired || status === 'expired') {
            return <Badge variant="secondary">Expired</Badge>;
        }
        return <Badge variant="outline" className="border-primary text-primary">Pending</Badge>;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Create Invitation Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IconUserPlus className="w-5 h-5" />
                        Invite New User
                    </CardTitle>
                    <CardDescription>
                        Send an invitation to add a new team member. They will receive a link to complete their registration.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1"
                        />
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleCreateInvitation}
                            disabled={isCreating || !email || !role}
                            className="gap-2"
                        >
                            {isCreating ? (
                                <IconLoader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <IconUserPlus className="w-4 h-4" />
                            )}
                            Send Invitation
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Invitations List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Invitations</CardTitle>
                    <CardDescription>
                        Manage sent invitations. Copy links, resend, or revoke pending invitations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : !invitationsData?.invitations?.length ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No invitations sent yet. Send your first invitation above!
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitationsData.invitations.map((invitation: {
                                        _id: string;
                                        email: string;
                                        role: string;
                                        status: string;
                                        token: string;
                                        createdAt: string;
                                        expiresAt: string;
                                    }) => (
                                        <TableRow key={invitation._id}>
                                            <TableCell className="font-medium">{invitation.email}</TableCell>
                                            <TableCell className="capitalize">
                                                {invitation.role.replace(/-/g, ' ')}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(invitation.status, invitation.expiresAt)}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(invitation.createdAt), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(invitation.expiresAt), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {invitation.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleCopyLink(invitation.token)}
                                                                title="Copy invite link"
                                                            >
                                                                <IconCopy className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleResend(invitation._id)}
                                                                disabled={isResending}
                                                                title="Resend invitation"
                                                            >
                                                                <IconRefresh className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setSelectedInvitationId(invitation._id);
                                                                    setRevokeDialogOpen(true);
                                                                }}
                                                                className="text-destructive hover:text-destructive"
                                                                title="Revoke invitation"
                                                            >
                                                                <IconTrash className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Revoke Confirmation Dialog */}
            <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to revoke this invitation? The invite link will no longer work.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevoke}
                            disabled={isRevoking}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isRevoking ? 'Revoking...' : 'Revoke'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
