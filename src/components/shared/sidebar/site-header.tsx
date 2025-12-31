'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { NavUser } from './nav-user';
import { Separator } from '@/components/ui/separator';
import { usePathname } from 'next/navigation';
import { data } from '@/data/site-header';
import NotificationBell from '@/components/notifications/NotificationBell';

export function SiteHeader() {
    const pathname = usePathname();

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center px-4 justify-between">
                <div className="flex w-full items-center">
                    <SidebarTrigger />
                    <Separator
                        orientation="vertical"
                        className="mx-2 data-[orientation=vertical]:h-4"
                    />
                    <h1 className="text-base font-medium">
                        {
                            data.find((d) => pathname.startsWith(d.location))
                                ?.title
                        }
                    </h1>
                </div>

                <div className="items-end">
                    <div className="flex items-center gap-3 w-full">
                        <NotificationBell />

                        <NavUser />
                    </div>
                </div>
            </div>
        </header>
    );
}
