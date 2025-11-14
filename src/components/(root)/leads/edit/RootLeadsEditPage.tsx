'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import {
    useGetLeadByIdQuery,
    useUpdateLeadMutation,
} from '@/redux/features/lead/leadApi';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
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
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Spinner } from '@/components/ui/spinner';
import { CountrySelect } from '@/components/shared/CountrySelect';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { IActivity } from '@/types/lead.interface';

const statusList = [
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
] as const;

const contactPersonSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    designation: z.string().optional(),
    emails: z
        .array(z.string().email('Invalid email'))
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
    notes: z.string().optional(),
    contactPersons: z
        .array(contactPersonSchema)
        .min(1, 'At least one contact person is required'),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export default function RootLeadsEditPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const {
        data,
        isLoading: loadingLead,
        isError,
    } = useGetLeadByIdQuery(id, { skip: !id });
    const [updateLead, { isLoading: updating }] = useUpdateLeadMutation();

    const isLoading = loadingLead || updating;

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
            notes: '',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'contactPersons',
    });

    useEffect(() => {
        if (data?.lead) {
            const lead = data.lead;
            const formattedLead = {
                ...lead,
            };
            form.reset(formattedLead);
        }
    }, [data, form]);

    const onSubmit = async (values: LeadFormValues) => {
        try {
            const res = await updateLead({ id, body: values }).unwrap();
            if (res.success) {
                toast.success('Lead updated successfully!');
                router.push('/leads');
            } else {
                toast.error(res.message || 'Update failed.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update lead.');
        }
    };

    if (loadingLead) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Loading Lead Data...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Spinner />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>Failed to load lead information.</p>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="max-w-5xl w-full mx-auto mt-6 space-y-8"
            >
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

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input
                                    {...form.register('address')}
                                    placeholder="Enter address"
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
                                />
                                {form.formState.errors?.country && (
                                    <p className="text-sm text-red-600">
                                        {form.formState.errors.country.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Person(s)</CardTitle>
                        <CardDescription>
                            Add one or more contact persons.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                                            Contact Person {index + 1}
                                        </h3>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => remove(index)}
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

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                {...form.register('notes')}
                                placeholder="Additional notes..."
                            />
                            {form.formState.errors?.notes && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.notes.message}
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Spinner /> : 'Submit'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => form.reset()}
                        >
                            Cancel
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
