'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    Search,
    RefreshCcw,
    Shield,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import {
    useGetAllUsersQuery,
    useUnlockUserAccountMutation,
} from '@/redux/features/user/userApi';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface User {
    _id: string;
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    failedLoginAttempts?: number;
    lockUntil?: string;
    lastLogin?: string;
    createdAt: string;
}

const roleColors: Record<string, string> = {
    'super-admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'admin': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'telemarketer': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'digital-marketer': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'seo-executive': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'web-developer': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'graphic-designer': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

export default function RootMembersPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, isFetching } = useGetAllUsersQuery({
        role: 'all-role',
        includeAdmins: true,
    });

    const [unlockAccount, { isLoading: isUnlocking }] = useUnlockUserAccountMutation();

    const users: User[] = data?.users || [];

    const filteredUsers = users.filter((user) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower)
        );
    });

    const handleUnlock = async (userId: string, userName: string) => {
        try {
            await unlockAccount(userId).unwrap();
            toast.success(`Account unlocked for ${userName}`);
        } catch {
            toast.error('Failed to unlock account');
        }
    };

    const isAccountLocked = (user: User) => {
        return user.lockUntil && new Date(user.lockUntil) > new Date();
    };

    const getAccountStatus = (user: User) => {
        if (isAccountLocked(user)) {
            return {
                icon: <ShieldAlert className="h-4 w-4" />,
                label: 'Locked',
                className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            };
        }
        if ((user.failedLoginAttempts || 0) > 0) {
            return {
                icon: <Shield className="h-4 w-4" />,
                label: `${user.failedLoginAttempts} failed`,
                className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            };
        }
        return {
            icon: <ShieldCheck className="h-4 w-4" />,
            label: 'Secure',
            className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        Members
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage team members and account security
                    </p>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Members Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>All Members ({filteredUsers.length})</span>
                        {isFetching && !isLoading && (
                            <RefreshCcw className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="border">Member</TableHead>
                                        <TableHead className="border">Contact</TableHead>
                                        <TableHead className="border">Role</TableHead>
                                        <TableHead className="border">Account Status</TableHead>
                                        <TableHead className="border">Last Login</TableHead>
                                        <TableHead className="border text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => {
                                        const status = getAccountStatus(user);
                                        const locked = isAccountLocked(user);
                                        const hasFailedAttempts = (user.failedLoginAttempts || 0) > 0;

                                        return (
                                            <TableRow key={user._id}>
                                                <TableCell className="border">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                                                            {user.firstName[0]}{user.lastName?.[0] || ''}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">
                                                                {user.firstName} {user.lastName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border">
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm">{user.email}</p>
                                                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border">
                                                    <Badge className={roleColors[user.role] || 'bg-gray-100 text-gray-700'}>
                                                        {user.role.replace(/-/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="border">
                                                    <Badge variant="outline" className={`gap-1.5 ${status.className}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="border text-muted-foreground text-sm">
                                                    {user.lastLogin
                                                        ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                                                        : 'Never'}
                                                </TableCell>
                                                <TableCell className="border text-center">
                                                    {(locked || hasFailedAttempts) ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1.5"
                                                            onClick={() => handleUnlock(user._id, `${user.firstName} ${user.lastName || ''}`)}
                                                            disabled={isUnlocking}
                                                        >
                                                            <RefreshCcw className={`h-3.5 w-3.5 ${isUnlocking ? 'animate-spin' : ''}`} />
                                                            Reset
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-1">No members found</h3>
                            <p className="text-muted-foreground text-center">
                                {searchQuery ? 'Try adjusting your search query' : 'No team members have been added yet'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
