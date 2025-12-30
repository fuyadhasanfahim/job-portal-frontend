'use client';

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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignUpFormValues, signupSchema } from '@/validators/auth.schema';
import { Check, X, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSignupMutation } from '@/redux/features/auth/authApi';
import { useValidateInvitationQuery } from '@/redux/features/invitation/invitationApi';
import { toast } from 'sonner';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SignUpForm() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    // Validate invitation token
    const { data: invitationData, isLoading: isValidating, error: validationError } = useValidateInvitationQuery(
        token || '',
        { skip: !token }
    );

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
        },
    });

    // Pre-fill email when invitation is validated
    useEffect(() => {
        if (invitationData?.success && invitationData.invitation?.email) {
            form.setValue('email', invitationData.invitation.email);
        }
    }, [invitationData, form]);

    const [signup, { isLoading }] = useSignupMutation();
    const isDisabled = isLoading || form.formState.isSubmitting || isValidating;

    const onSubmit = async (values: SignUpFormValues) => {
        if (!token) {
            toast.error('Invalid invitation. Please use the link from your invitation email.');
            return;
        }

        try {
            const resPromise = signup({ ...values, invitationToken: token }).unwrap();

            await toast.promise(resPromise, {
                loading: 'Creating your account...',
                success: (data) => {
                    router.push('/sign-in');
                    return data?.message ?? '🎉 Account created successfully!';
                },
                error: (err) => {
                    return (
                        err?.data?.message ??
                        '⚠️ Something went wrong while creating your account.'
                    );
                },
            });
        } catch (err) {
            console.error(err);
            toast.error('Unexpected error. Please try again later.');
        }
    };

    const rules = [
        {
            label: 'At least 6 characters',
            test: (pw: string) => pw.length >= 6,
        },
        {
            label: 'At least one uppercase letter',
            test: (pw: string) => /[A-Z]/.test(pw),
        },
        {
            label: 'At least one lowercase letter',
            test: (pw: string) => /[a-z]/.test(pw),
        },
        { label: 'At least one number', test: (pw: string) => /\d/.test(pw) },
        {
            label: 'At least one special character (@$!%*?&)',
            test: (pw: string) => /[@$!%*?&]/.test(pw),
        },
    ];

    // No token provided
    if (!token) {
        return (
            <div className="w-full max-w-md mx-auto">
                <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Invitation Required</AlertTitle>
                    <AlertDescription>
                        You need a valid invitation to create an account.
                        Please contact an administrator to get an invitation link.
                    </AlertDescription>
                </Alert>
                <div className="mt-4 text-center">
                    <Link
                        href="/sign-in"
                        className="text-sm text-primary hover:underline"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    // Validating token
    if (isValidating) {
        return (
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center gap-4 py-12">
                <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Validating invitation...</p>
            </div>
        );
    }

    // Invalid or expired token
    if (validationError || !invitationData?.success) {
        return (
            <div className="w-full max-w-md mx-auto">
                <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Invalid Invitation</AlertTitle>
                    <AlertDescription>
                        This invitation link is invalid, expired, or has already been used.
                        Please contact an administrator for a new invitation.
                    </AlertDescription>
                </Alert>
                <div className="mt-4 text-center">
                    <Link
                        href="/sign-in"
                        className="text-sm text-primary hover:underline"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Complete Your Registration</CardTitle>
                            <CardDescription>
                                You've been invited to join. Fill in the form below to create your account.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Invitation Info Banner */}
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
                                <Mail className="w-5 h-5 text-primary mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium">Invitation Details</p>
                                    <p className="text-muted-foreground">
                                        Email: <span className="font-medium">{invitationData.invitation?.email}</span>
                                    </p>
                                    <p className="text-muted-foreground">
                                        Role: <span className="font-medium capitalize">{invitationData.invitation?.role?.replace(/-/g, ' ')}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 items-start gap-6">
                                {/* First Name */}
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="John"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Last Name */}
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Doe"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Email - Read Only */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                {...field}
                                                readOnly
                                                className="bg-muted cursor-not-allowed"
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Email is set by your invitation and cannot be changed.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Phone */}
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="tel"
                                                placeholder="+8801XXXXXXXXX"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Password with conditional checklist */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => {
                                    return (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        type={
                                                            showPassword
                                                                ? 'text'
                                                                : 'password'
                                                        }
                                                        placeholder="••••••••"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            setPassword(
                                                                e.target.value
                                                            );
                                                        }}
                                                    />
                                                </FormControl>
                                                {/* Toggle button */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            (prev) => !prev
                                                        )
                                                    }
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showPassword ? (
                                                        <IconEyeOff
                                                            stroke={2}
                                                            size={18}
                                                        />
                                                    ) : (
                                                        <IconEye
                                                            stroke={2}
                                                            size={18}
                                                        />
                                                    )}
                                                </button>
                                            </div>
                                            <FormMessage />

                                            {/* Checklist only if user typed something */}
                                            {password && (
                                                <div className="mt-2 space-y-1 text-sm">
                                                    {rules.map((rule, idx) => {
                                                        const passed =
                                                            rule.test(password);
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={`flex items-center gap-2 ${passed
                                                                        ? 'text-green-600'
                                                                        : 'text-gray-500'
                                                                    }`}
                                                            >
                                                                {passed ? (
                                                                    <Check
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <X
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                )}
                                                                <span>
                                                                    {rule.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </FormItem>
                                    );
                                }}
                            />
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isDisabled}
                            >
                                {isDisabled ? (
                                    <IconLoader2 className="animate-spin" />
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                            <p className="text-sm text-center text-gray-600">
                                Already have an account?{' '}
                                <Link
                                    href="/sign-in"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
