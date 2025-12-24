'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { IconPlus, IconTrash, IconRefresh } from '@tabler/icons-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
    useNewLeadMutation,
    useLazySearchLeadByCompanyQuery,
    useAddContactPersonMutation,
} from '@/redux/features/lead/leadApi';
import { useGetGroupsQuery } from '@/redux/features/group/groupApi';
import type { IGroup } from '@/types/group.interface';
import { CountrySelect } from '@/components/shared/CountrySelect';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDownIcon, InfoIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { IActivity } from '@/types/lead.interface';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const status = [
    'new',
    'busy',
    'interested',
    'not-interested',
    'call-back',
    'test-trial',
    'on-board',
    'no-answer',
    'email/whatsApp-sent',
    'language-barrier',
    'invalid-number',
];

const contactPersonSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    designation: z.string().optional(),
    emails: z
        .array(z.email('Invalid email'))
        .min(1, 'At least one email required'),
    phones: z
        .array(z.string().min(7, 'Phone must be at least 7 digits'))
        .min(1, 'At least one phone required'),
});

const leadSchema = z.object({
    company: z.object({
        name: z.string().min(1, 'Company name is required'),
        website: z.url('Invalid URL').or(z.literal('')).optional(),
    }),
    address: z.string().optional(),
    country: z.string().min(1, 'Country is required'),
    status: z.enum([
        'new',
        'busy',
        'interested',
        'not-interested',
        'call-back',
        'test-trial',
        'on-board',
        'no-answer',
        'email/whatsApp-sent',
        'language-barrier',
        'invalid-number',
    ]),
    group: z.string().min(1, 'Group is required'),
    notes: z.string().optional(),
    activities: z
        .array(
            z.object({
                status: z.enum([
                    'new',
                    'busy',
                    'interested',
                    'not-interested',
                    'call-back',
                    'test-trial',
                    'on-board',
                    'no-answer',
                    'email/whatsApp-sent',
                    'language-barrier',
                    'invalid-number',
                ]),
                notes: z.string().optional(),
                nextAction: z
                    .enum(['follow-up', 'send-proposal', 'call-back', 'close'])
                    .optional(),
                dueAt: z.date().optional(),
                at: z.date(),
            })
        )
        .optional(),
    contactPersons: z
        .array(contactPersonSchema)
        .min(1, 'At least one contact person is required'),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface ExistingLead {
    _id: string;
    company: { name: string; website: string };
    address?: string;
    country: string;
    notes?: string;
    status: string;
    contactPersons: Array<{
        firstName?: string;
        lastName?: string;
        designation?: string;
        emails: string[];
        phones: string[];
    }>;
}

export default function LeadForm() {
    const form = useForm<LeadFormValues>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            company: { name: '', website: '' },
            contactPersons: [
                {
                    firstName: '',
                    lastName: '',
                    designation: '',
                    emails: [''],
                    phones: [''],
                },
            ],
            address: '',
            country: '',
            group: '',
            notes: '',
            status: 'new',
            activities: [
                {
                    status: 'new',
                    nextAction: undefined,
                    dueAt: undefined,
                    at: new Date(),
                },
            ],
        },
    });

    const [open, setOpen] = useState(false);
    const [existingLead, setExistingLead] = useState<ExistingLead | null>(null);
    const [isAddingContactMode, setIsAddingContactMode] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [newLead, { isLoading }] = useNewLeadMutation();
    const [searchLead] = useLazySearchLeadByCompanyQuery();
    const [addContactPerson, { isLoading: isAddingContact }] =
        useAddContactPersonMutation();
    const { data: groupsResponse } = useGetGroupsQuery();
    const groups: IGroup[] = groupsResponse?.data || [];

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: 'contactPersons',
    });

    // Debounced search function
    const debouncedSearch = useCallback(
        async (companyName: string, website: string) => {
            if (!companyName && !website) {
                setExistingLead(null);
                setIsAddingContactMode(false);
                return;
            }

            try {
                const result = await searchLead({
                    name: companyName || undefined,
                    website: website || undefined,
                }).unwrap();

                if (result.found && result.lead) {
                    setExistingLead(result.lead);
                    setIsAddingContactMode(true);

                    // Auto-fill form with existing lead data
                    form.setValue('company.name', result.lead.company.name);
                    form.setValue(
                        'company.website',
                        result.lead.company.website || ''
                    );
                    form.setValue('address', result.lead.address || '');
                    form.setValue('country', result.lead.country);
                    form.setValue('notes', result.lead.notes || '');
                    form.setValue(
                        'status',
                        result.lead.status as LeadFormValues['status']
                    );
                    // Set group - extract ID from populated object if needed
                    if (result.lead.group) {
                        const groupId = typeof result.lead.group === 'object' && '_id' in result.lead.group
                            ? (result.lead.group as { _id: string })._id
                            : result.lead.group;
                        form.setValue('group', groupId as string);
                    }

                    // Clear contact persons and add empty one for new contact
                    replace([
                        {
                            firstName: '',
                            lastName: '',
                            designation: '',
                            emails: [''],
                            phones: [''],
                        },
                    ]);

                    toast.info(
                        `Existing lead found: "${result.lead.company.name}". Add a new contact person below.`
                    );
                } else {
                    setExistingLead(null);
                    setIsAddingContactMode(false);
                }
            } catch {
                // Silently fail - user can still create new lead
                setExistingLead(null);
                setIsAddingContactMode(false);
            }
        },
        [searchLead, form, replace]
    );

    // Watch company name and website for changes
    const companyName = form.watch('company.name');
    const companyWebsite = form.watch('company.website');

    useEffect(() => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Don't search if in add contact mode (already found a lead)
        if (isAddingContactMode && existingLead) {
            return;
        }

        // Debounce the search
        debounceTimerRef.current = setTimeout(() => {
            if (companyName || companyWebsite) {
                debouncedSearch(companyName || '', companyWebsite || '');
            }
        }, 500);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [companyName, companyWebsite, debouncedSearch, isAddingContactMode, existingLead]);

    const resetForm = () => {
        setExistingLead(null);
        setIsAddingContactMode(false);
        form.reset({
            company: { name: '', website: '' },
            contactPersons: [
                {
                    firstName: '',
                    lastName: '',
                    designation: '',
                    emails: [''],
                    phones: [''],
                },
            ],
            address: '',
            country: '',
            notes: '',
            status: 'new',
            activities: [
                {
                    status: 'new',
                    nextAction: undefined,
                    dueAt: undefined,
                    at: new Date(),
                },
            ],
        });
    };

    const onSubmit = async (values: LeadFormValues) => {
        try {
            if (isAddingContactMode && existingLead) {
                // Add contact person to existing lead
                const contactPerson = values.contactPersons[0];
                if (!contactPerson) {
                    toast.error('Please add contact person details.');
                    return;
                }

                const res = await addContactPerson({
                    leadId: existingLead._id,
                    contactPerson,
                }).unwrap();

                if (res.success) {
                    toast.success(
                        res.message || 'Contact person added successfully!'
                    );
                    resetForm();
                } else {
                    toast.error(res.message || 'Failed to add contact person.');
                }
            } else {
                // Create new lead
                const res = await newLead(values).unwrap();

                if (res.success) {
                    if (res.duplicate) {
                        toast.warning(
                            res.message ||
                            'Duplicate lead found with same company name & website.'
                        );
                    } else {
                        toast.success(
                            res.message || 'Lead created successfully!'
                        );
                        resetForm();
                    }
                } else {
                    toast.error(res.message || 'Failed to create lead.');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(
                (error as Error).message || 'An unexpected error occurred.'
            );
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="max-w-5xl mx-auto mt-6 space-y-8"
            >
                {/* Existing Lead Alert */}
                {isAddingContactMode && existingLead && (
                    <Alert className="border-blue-200 bg-blue-50">
                        <InfoIcon className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">
                            Existing Lead Found
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            <p>
                                This company already exists in your leads with{' '}
                                <strong>{existingLead.contactPersons.length}</strong> contact person(s).
                                The company info has been pre-filled. You can add a new contact person below.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={resetForm}
                            >
                                <IconRefresh className="h-4 w-4 mr-1" />
                                Start Fresh
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                        <CardDescription>
                            Basic details about the company.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6 items-start">
                            <div className="space-y-2">
                                <Label>Company Name *</Label>
                                <Input
                                    {...form.register('company.name')}
                                    placeholder="Enter company name"
                                    disabled={isAddingContactMode}
                                />
                                {form.formState.errors.company?.name && (
                                    <p className="text-sm text-red-600">
                                        {
                                            form.formState.errors.company.name
                                                .message
                                        }
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Website *</Label>
                                <Input
                                    {...form.register('company.website')}
                                    placeholder="https://example.com"
                                    disabled={isAddingContactMode}
                                />
                                {form.formState.errors.company?.website && (
                                    <p className="text-sm text-red-600">
                                        {
                                            form.formState.errors.company
                                                .website.message
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Address + Country */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input
                                    {...form.register('address')}
                                    placeholder="Enter address"
                                    disabled={isAddingContactMode}
                                />
                                {form.formState.errors?.address && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.address.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Country *</Label>
                                <CountrySelect
                                    value={form.watch('country')}
                                    onChange={(val) =>
                                        form.setValue('country', val)
                                    }
                                    disabled={isAddingContactMode}
                                />
                                {form.formState.errors?.country && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.country.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Group Select */}
                        <div className="space-y-2">
                            <Label>Group *</Label>
                            <Select
                                value={form.watch('group') || ''}
                                onValueChange={(val) => form.setValue('group', val)}
                                disabled={isAddingContactMode}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groups.map((group) => (
                                        <SelectItem key={group._id} value={group._id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: group.color || '#6366f1' }}
                                                />
                                                {group.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors?.group && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.group.message}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {isAddingContactMode
                                ? 'Add New Contact Person'
                                : 'Contact Person(s)'}
                        </CardTitle>
                        <CardDescription>
                            {isAddingContactMode
                                ? 'Add a new contact person to this existing lead.'
                                : 'Add one or more contact persons.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Show existing contact persons when in adding mode */}
                        {isAddingContactMode && existingLead && existingLead.contactPersons.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-700 mb-3">
                                    Existing Contact Persons ({existingLead.contactPersons.length})
                                </h4>
                                <div className="space-y-3">
                                    {existingLead.contactPersons.map((contact, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {contact.firstName || ''} {contact.lastName || ''}
                                                        {!contact.firstName && !contact.lastName && (
                                                            <span className="text-gray-400 italic">No name</span>
                                                        )}
                                                    </p>
                                                    {contact.designation && (
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                            {contact.designation}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Email(s): </span>
                                                    <span className="text-gray-700">
                                                        {contact.emails?.length > 0
                                                            ? contact.emails.join(', ')
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Phone(s): </span>
                                                    <span className="text-gray-700">
                                                        {contact.phones?.length > 0
                                                            ? contact.phones.join(', ')
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200 mt-4 pt-4">
                                    <h4 className="font-semibold text-gray-700 mb-1">Add New Contact</h4>
                                    <p className="text-sm text-gray-500 mb-3">
                                        Fill in the details below to add a new contact person to this lead.
                                    </p>
                                </div>
                            </div>
                        )}
                        {fields.map((field, index) => {
                            const contactEmails = form.watch(
                                `contactPersons.${index}.emails`
                            );
                            const setEmails = (next: string[]) =>
                                form.setValue(
                                    `contactPersons.${index}.emails`,
                                    next
                                );

                            const contactPhones = form.watch(
                                `contactPersons.${index}.phones`
                            );
                            const setPhones = (next: string[]) =>
                                form.setValue(
                                    `contactPersons.${index}.phones`,
                                    next
                                );

                            return (
                                <div
                                    key={field.id}
                                    className="p-4 border rounded-lg space-y-4"
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">
                                            {isAddingContactMode
                                                ? 'New Contact Person'
                                                : `Contact Person ${index + 1}`}
                                        </h3>
                                        {fields.length > 1 &&
                                            !isAddingContactMode && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() =>
                                                        remove(index)
                                                    }
                                                >
                                                    <IconTrash className="h-4 w-4" />
                                                </Button>
                                            )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input
                                                {...form.register(
                                                    `contactPersons.${index}.firstName`
                                                )}
                                                placeholder="First name"
                                            />
                                            {form.formState.errors
                                                ?.contactPersons?.[index]
                                                ?.firstName && (
                                                    <p className="text-sm text-red-600">
                                                        {
                                                            form.formState.errors
                                                                .contactPersons[
                                                                index
                                                            ].firstName.message
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input
                                                {...form.register(
                                                    `contactPersons.${index}.lastName`
                                                )}
                                                placeholder="Last name"
                                            />
                                            {form.formState.errors
                                                ?.contactPersons?.[index]
                                                ?.lastName && (
                                                    <p className="text-sm text-red-600">
                                                        {
                                                            form.formState.errors
                                                                .contactPersons[
                                                                index
                                                            ].lastName.message
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Emails */}
                                        <div className="space-y-2">
                                            <Label>Email(s) *</Label>
                                            {contactEmails.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex gap-2 mt-1"
                                                >
                                                    <Input
                                                        {...form.register(
                                                            `contactPersons.${index}.emails.${i}`
                                                        )}
                                                        placeholder="email@example.com"
                                                    />
                                                    {i === 0 ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() =>
                                                                setEmails([
                                                                    ...contactEmails,
                                                                    '',
                                                                ])
                                                            }
                                                        >
                                                            <IconPlus className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() =>
                                                                setEmails(
                                                                    contactEmails.filter(
                                                                        (
                                                                            _,
                                                                            idx
                                                                        ) =>
                                                                            idx !==
                                                                            i
                                                                    )
                                                                )
                                                            }
                                                        >
                                                            <IconTrash className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            {form.formState.errors
                                                ?.contactPersons?.[index]
                                                ?.emails && (
                                                    <p className="text-sm text-red-600">
                                                        {
                                                            form.formState.errors
                                                                .contactPersons[
                                                                index
                                                            ].emails.message
                                                        }
                                                    </p>
                                                )}
                                        </div>

                                        {/* Phones */}
                                        <div className="space-y-2">
                                            <Label>Phone(s) *</Label>
                                            {contactPhones.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex gap-2 mt-1"
                                                >
                                                    <Input
                                                        {...form.register(
                                                            `contactPersons.${index}.phones.${i}`
                                                        )}
                                                        placeholder="01xxxxxxxxx"
                                                    />
                                                    {i === 0 ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() =>
                                                                setPhones([
                                                                    ...contactPhones,
                                                                    '',
                                                                ])
                                                            }
                                                        >
                                                            <IconPlus className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() =>
                                                                setPhones(
                                                                    contactPhones.filter(
                                                                        (
                                                                            _,
                                                                            idx
                                                                        ) =>
                                                                            idx !==
                                                                            i
                                                                    )
                                                                )
                                                            }
                                                        >
                                                            <IconTrash className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            {form.formState.errors
                                                ?.contactPersons?.[index]
                                                ?.phones && (
                                                    <p className="text-sm text-red-600">
                                                        {
                                                            form.formState.errors
                                                                .contactPersons[
                                                                index
                                                            ].phones.message
                                                        }
                                                    </p>
                                                )}
                                        </div>

                                        <div className="space-y-2 col-span-2">
                                            <Label>Designation</Label>
                                            <Input
                                                {...form.register(
                                                    `contactPersons.${index}.designation`
                                                )}
                                                placeholder="Designation"
                                            />
                                            {form.formState.errors
                                                ?.contactPersons?.[index]
                                                ?.designation && (
                                                    <p className="text-sm text-red-600">
                                                        {
                                                            form.formState.errors
                                                                .contactPersons[
                                                                index
                                                            ].designation.message
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {!isAddingContactMode && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    append({
                                        firstName: '',
                                        lastName: '',
                                        designation: '',
                                        emails: [''],
                                        phones: [''],
                                    })
                                }
                            >
                                <IconPlus />
                                Add Another Contact Person
                            </Button>
                        )}

                        <Card className="shadow-none">
                            <CardContent>
                                <div className="flex items-start justify-between gap-6">
                                    <div className="space-y-2 w-full">
                                        <Label>Status *</Label>
                                        <Select
                                            value={form.watch('status')}
                                            onValueChange={(v) =>
                                                form.setValue(
                                                    'status',
                                                    v as z.infer<
                                                        typeof leadSchema
                                                    >['status']
                                                )
                                            }
                                            disabled={isAddingContactMode}
                                        >
                                            <SelectTrigger className="w-full capitalize">
                                                <SelectValue
                                                    placeholder="Select status"
                                                    className="capitalize"
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="capitalize">
                                                {status.map((status) => (
                                                    <SelectItem
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors?.status && (
                                            <p className="text-sm text-red-600">
                                                {
                                                    form.formState.errors.status
                                                        .message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 w-full">
                                        <Label>Next Action</Label>
                                        <Select
                                            value={form.watch(
                                                'activities.0.nextAction'
                                            )}
                                            onValueChange={(v) =>
                                                form.setValue(
                                                    'activities.0.nextAction',
                                                    v as IActivity['nextAction']
                                                )
                                            }
                                            disabled={isAddingContactMode}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select next action" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="follow-up">
                                                    Follow Up
                                                </SelectItem>
                                                <SelectItem value="send-proposal">
                                                    Send Proposal
                                                </SelectItem>
                                                <SelectItem value="call-back">
                                                    Call Back
                                                </SelectItem>
                                                <SelectItem value="close">
                                                    Close
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors?.activities && (
                                            <p className="text-sm text-red-600">
                                                {
                                                    form.formState.errors
                                                        .activities[0]
                                                        ?.nextAction?.message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 w-full">
                                        <Label>Due Date</Label>
                                        <Popover
                                            open={open}
                                            onOpenChange={setOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="justify-between"
                                                    disabled={isAddingContactMode}
                                                >
                                                    {(() => {
                                                        const dueAt =
                                                            form.watch(
                                                                'activities.0.dueAt'
                                                            );
                                                        return dueAt
                                                            ? format(
                                                                dueAt,
                                                                'PPP'
                                                            )
                                                            : 'Select date';
                                                    })()}
                                                    <ChevronDownIcon />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    selected={form.watch(
                                                        'activities.0.dueAt'
                                                    )}
                                                    onSelect={(v) => {
                                                        form.setValue(
                                                            'activities.0.dueAt',
                                                            v as IActivity['dueAt']
                                                        );
                                                        setOpen(!open);
                                                    }}
                                                    mode="single"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {form.formState.errors?.activities && (
                                            <p className="text-sm text-red-600">
                                                {
                                                    form.formState.errors
                                                        .activities[0]?.dueAt
                                                        ?.message
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        {...form.register('notes')}
                                        placeholder="Additional notes..."
                                        disabled={isAddingContactMode}
                                    />
                                    {form.formState.errors?.notes && (
                                        <p className="text-sm text-red-600">
                                            {
                                                form.formState.errors.notes
                                                    .message
                                            }
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </CardContent>
                    <CardFooter className="flex gap-4">
                        <Button
                            type="submit"
                            disabled={isLoading || isAddingContact}
                        >
                            {isLoading || isAddingContact ? (
                                <Spinner />
                            ) : isAddingContactMode ? (
                                'Add Contact Person'
                            ) : (
                                'Submit'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                        >
                            Cancel
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
