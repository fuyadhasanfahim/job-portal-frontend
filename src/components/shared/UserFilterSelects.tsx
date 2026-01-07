'use client';

import React from 'react';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllUsersQuery } from '@/redux/features/user/userApi';
import { IUser } from '@/types/user.interface';
import { useSignedUser } from '@/hooks/useSignedUser';

const roles = [
    'all-role',
    'super-admin',
    'admin',
    'lead-generator',
    'telemarketer',
    'digital-marketer',
    'seo-executive',
    'social-media-executive',
    'web-developer',
    'photo-editor',
    'graphic-designer',
];

export function UserFilterSelects({
    selectedRole,
    setSelectedRole,
    selectedUserId,
    setSelectedUserId,
    disabled = false,
}: {
    selectedRole: string;
    setSelectedRole: (val: string) => void;
    selectedUserId: string;
    setSelectedUserId: (val: string) => void;
    disabled?: boolean;
}) {
    const { user } = useSignedUser();

    const {
        data: usersData,
        isLoading: usersLoading,
        isFetching: usersFetching,
    } = useGetAllUsersQuery(
        { role: selectedRole, userId: selectedUserId },
        { skip: disabled }
    );

    const users = usersData?.users ?? [];

    return (
        (user?.role === 'admin' || user?.role === 'super-admin') && (
            <div className="flex items-center gap-2">
                <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                    disabled={disabled}
                >
                    <SelectTrigger id="role" className="w-full h-9 text-sm capitalize">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map((r, i) => (
                            <SelectItem
                                key={i}
                                value={r}
                                className="capitalize"
                            >
                                {r.replace(/-/g, ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    disabled={disabled}
                >
                    <SelectTrigger id="users" className="w-full h-9 text-sm capitalize">
                        <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all-user">All Users</SelectItem>
                        {usersLoading || usersFetching ? (
                            <div className="space-y-2 p-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="space-y-1 w-full">
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-2 w-3/4" />
                                    </div>
                                ))}
                            </div>
                        ) : users.length > 0 ? (
                            users.map((u: IUser) => (
                                <SelectItem key={u._id} value={u._id}>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {u.firstName} {u.lastName}
                                        </span>
                                        <span className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 bg-muted rounded">
                                            {u.role?.replace(/-/g, ' ')}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="no-users" disabled>
                                No users found
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        )
    );
}
