'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGetLeadByIdQuery } from '@/redux/features/lead/leadApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    IconArrowLeft,
    IconWorld,
    IconMail,
    IconPhone,
    IconMapPin,
    IconUser,
    IconNotebook,
    IconEdit,
    IconNote,
    IconInfoCircle,
    IconFolders,
} from '@tabler/icons-react';
import type { ILead } from '@/types/lead.interface';
import { IUser } from '@/types/user.interface';
import { format } from 'date-fns';

export default function LeadDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, isError } = useGetLeadByIdQuery(id, {
        skip: !id,
    });

    if (isLoading)
        return (
            <div className="p-8 space-y-4">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        );

    if (isError || !data?.lead)
        return (
            <div className="p-8 text-center text-gray-500 space-y-4">
                <p>Lead not found or access forbidden.</p>
                <Link href="/leads">
                    <Button variant="outline">
                        <IconArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </Link>
            </div>
        );

    const lead: ILead = data.lead;

    return (
        <div className="p-8">
            {/* --- Header --- */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {lead.company?.name || 'Unnamed Company'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Lead ID: {lead._id.slice(-6)}
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <Badge className="capitalize">
                        {lead.status.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-2">
                        <Link href="/leads">
                            <Button variant="outline">
                                <IconArrowLeft className="h-4 w-4 mr-1" />
                                Back
                            </Button>
                        </Link>
                        <Link href={`/leads/edit/${id}`}>
                            <Button variant="outline">
                                <IconEdit className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- Lead Overview --- */}
            <Card className="mb-8 shadow-sm border border-gray-200 rounded-xl">
                <CardHeader className="flex items-center gap-2">
                    <IconInfoCircle className="h-5 w-5 text-sky-500" />
                    <CardTitle className="text-lg font-medium">
                        Lead Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-3">
                    <div className="flex items-start gap-2">
                        <IconNote className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                            <p className="text-gray-500 font-medium mb-1">
                                Notes
                            </p>
                            <p className="text-gray-800 whitespace-pre-wrap">
                                {lead.notes?.trim()
                                    ? lead.notes
                                    : 'No notes available for this lead.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <IconNotebook className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-500 font-medium">
                            Status:
                        </span>
                        <Badge
                            variant="secondary"
                            className="capitalize font-semibold"
                        >
                            {lead.status}
                        </Badge>
                    </div>
                    {lead.group && (
                        <div className="flex items-center gap-2">
                            <IconFolders className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-500 font-medium">
                                Group:
                            </span>
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor:
                                            lead.group.color || '#6366f1',
                                    }}
                                />
                                <span className="font-medium">
                                    {lead.group.name}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="pt-3 mt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">
                                Created By
                            </p>
                            <div className="flex items-center gap-1.5">
                                <IconUser className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                    {(() => {
                                        const creator =
                                            lead.createdBy ||
                                            (lead.owner as unknown as IUser);
                                        return creator?.firstName
                                            ? `${creator.firstName} ${
                                                  creator.lastName || ''
                                              }`
                                            : '—';
                                    })()}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400">
                                {lead.createdAt
                                    ? format(new Date(lead.createdAt), 'PPP p')
                                    : '—'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">
                                Updated By
                            </p>
                            <div className="flex items-center gap-1.5">
                                <IconUser className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                    {lead.updatedBy?.firstName
                                        ? `${lead.updatedBy.firstName} ${
                                              lead.updatedBy.lastName || ''
                                          }`
                                        : '—'}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400">
                                {lead.updatedAt
                                    ? format(new Date(lead.updatedAt), 'PPP p')
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- Overview Stats --- */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <Card className="text-center p-4 shadow-sm">
                    <CardContent className="p-0">
                        <p className="text-sm text-gray-500 mb-1">Country</p>
                        <p className="text-base font-semibold capitalize">
                            {lead.country || 'N/A'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="text-center p-4 shadow-sm">
                    <CardContent className="p-0">
                        <p className="text-sm text-gray-500 mb-1">
                            Total Contacts
                        </p>
                        <p className="text-base font-semibold">
                            {lead.contactPersons?.length || 0}
                        </p>
                    </CardContent>
                </Card>

                <Card className="text-center p-4 shadow-sm">
                    <CardContent className="p-0">
                        <p className="text-sm text-gray-500 mb-1">Emails</p>
                        <p className="text-base font-semibold">
                            {(() => {
                                const contactEmails =
                                    lead.contactPersons?.flatMap(
                                        (cp) => cp.emails
                                    ) ?? [];
                                const uniqueEmails = new Set(contactEmails);
                                return uniqueEmails.size;
                            })()}
                        </p>
                    </CardContent>
                </Card>

                <Card className="text-center p-4 shadow-sm">
                    <CardContent className="p-0">
                        <p className="text-sm text-gray-500 mb-1">Phones</p>
                        <p className="text-base font-semibold">
                            {(() => {
                                const contactPhones =
                                    lead.contactPersons?.flatMap(
                                        (cp) => cp.phones
                                    ) ?? [];
                                const uniquePhones = new Set(contactPhones);
                                return uniquePhones.size;
                            })()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* --- Info Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Company Info */}
                <Card className="shadow-sm border border-gray-200 rounded-xl">
                    <CardHeader className="flex items-center gap-2">
                        <IconWorld className="h-5 w-5 text-blue-400" />
                        <CardTitle className="text-lg font-medium">
                            Company Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                            <IconWorld className="h-4 w-4 text-gray-500" />
                            {lead.company?.website ? (
                                <a
                                    href={lead.company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    {lead.company.website}
                                </a>
                            ) : (
                                <span>N/A</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <IconMapPin className="h-4 w-4 text-gray-500" />
                            <span className="capitalize">
                                {lead.address || lead.country || 'N/A'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Persons */}
                <Card className="shadow-sm border border-gray-200 rounded-xl">
                    <CardHeader className="flex items-center gap-2">
                        <IconUser className="h-5 w-5 text-purple-500" />
                        <CardTitle className="text-lg font-medium">
                            Contact Persons
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-700 space-y-4">
                        {lead.contactPersons?.length ? (
                            lead.contactPersons.map((person, i) => (
                                <div
                                    key={i}
                                    className="border-b last:border-none pb-3"
                                >
                                    <p className="font-medium">
                                        {person.firstName}{' '}
                                        {person.lastName || ''}
                                    </p>
                                    {person.designation && (
                                        <p className="text-gray-500">
                                            {person.designation}
                                        </p>
                                    )}
                                    <div className="mt-2 space-y-1">
                                        <p className="flex items-center gap-2">
                                            <IconMail className="h-4 w-4 text-gray-500" />
                                            <span>
                                                {person.emails?.length
                                                    ? person.emails.join(', ')
                                                    : 'N/A'}
                                            </span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <IconPhone className="h-4 w-4 text-gray-500" />
                                            <span>
                                                {person.phones?.length
                                                    ? person.phones.join(', ')
                                                    : 'N/A'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">
                                No contact persons found.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* --- Activities Section --- */}
            <Card className="mt-6 shadow-sm border border-gray-200 rounded-xl">
                <CardHeader className="flex items-center gap-2">
                    <IconNotebook className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-lg font-medium">
                        Recent Activities
                    </CardTitle>
                </CardHeader>

                <CardContent className="text-sm text-gray-700">
                    {lead.activities?.length ? (
                        <ul className="space-y-4">
                            {lead.activities.map((a, i) => (
                                <li
                                    key={i}
                                    className="border-l-2 border-gray-200 pl-3 pb-2 space-y-1"
                                >
                                    {/* Header Row */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="capitalize"
                                                >
                                                    {a.status.replace(
                                                        /-/g,
                                                        ' '
                                                    )}
                                                </Badge>

                                                {a.nextAction && (
                                                    <span className="text-xs text-gray-500 capitalize">
                                                        Next:{' '}
                                                        {a.nextAction.replace(
                                                            /-/g,
                                                            ' '
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            {a.dueAt && (
                                                <p className="text-xs text-gray-500">
                                                    Due:{' '}
                                                    {format(
                                                        new Date(a.dueAt),
                                                        'PPP'
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        <span className="text-xs text-gray-500">
                                            {a.at
                                                ? format(
                                                      new Date(a.at),
                                                      'PPP, p'
                                                  )
                                                : '—'}
                                        </span>
                                    </div>

                                    {/* Notes */}
                                    <div className="mt-1">
                                        <p className="text-gray-600 whitespace-pre-line">
                                            {a.notes?.trim()
                                                ? a.notes
                                                : 'No notes recorded.'}
                                        </p>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span>By:</span>
                                        <span className="font-medium text-gray-700">
                                            {a.byUser?.firstName
                                                ? `${a.byUser.firstName} ${
                                                      a.byUser.lastName ?? ''
                                                  }`
                                                : 'User'}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">
                            No recent activities recorded.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
