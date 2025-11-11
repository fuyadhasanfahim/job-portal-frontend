'use client';

import * as React from 'react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { data } from '@/data/sidebar';
import { useSignedUser } from '@/hooks/useSignedUser';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export function NavMain() {
    const { user, isLoading } = useSignedUser();
    const pathname = usePathname();

    if (isLoading && !user) {
        return (
            <SidebarGroup className="px-4">
                <SidebarGroupContent>
                    <SidebarMenu className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <SidebarMenuItem key={i}>
                                <Skeleton className="h-10 w-full rounded-[8px] bg-muted animate-pulse" />
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    const filteredData = data.filter((item) => item.access.includes(user?.role as string));

    return (
        <SidebarGroup className="px-4">
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu className="space-y-1">
                    {filteredData.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={item.title}
                                className={cn(
                                    pathname.startsWith(item.url) &&
                                        'bg-primary text-white shadow-md font-medium',
                                    'h-10 rounded-[8px] py-2 px-4 hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in-out'
                                )}
                                asChild
                            >
                                <Link href={item.url}>
                                    {item.icon && (
                                        <item.icon
                                            strokeWidth={2}
                                            className="size-4 shrink-0"
                                        />
                                    )}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
