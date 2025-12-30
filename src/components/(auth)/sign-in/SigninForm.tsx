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
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignInFormValues, signinSchema } from '@/validators/auth.schema';
import { toast } from 'sonner';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import Link from 'next/link';
import { useSigninMutation } from '@/redux/features/auth/authApi';
import { useRouter } from 'next/navigation';

export default function SignInForm() {
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<SignInFormValues>({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const [signin, { isLoading }] = useSigninMutation();
    const isDisabled = isLoading || form.formState.isSubmitting;

    const router = useRouter();

    const onSubmit = async (values: SignInFormValues) => {
        try {
            const resPromise = signin(values).unwrap();

            await toast.promise(resPromise, {
                loading: 'Signing you in...',
                success: (data) => {
                    router.push('/dashboard');
                    return data?.message ?? '✅ Welcome back!';
                },
                error: (err) =>
                    err?.data?.message ??
                    '⚠️ Invalid credentials. Please try again.',
            });
        } catch (err) {
            console.error(err);
            toast.error('Unexpected error. Please try again later.');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign In</CardTitle>
                            <CardDescription>
                                Enter your credentials to access your account.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Email */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="you@example.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Password */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
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
                                                />
                                            </FormControl>
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
                                    </FormItem>
                                )}
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
                                    'Sign In'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
