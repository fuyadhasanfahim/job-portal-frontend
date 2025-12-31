import { z } from 'zod';

export const signupSchema = z.object({
    firstName: z.string().trim().min(1, { message: 'First name is required.' }),

    lastName: z.string().trim().optional(),

    email: z.email({ message: 'Please enter a valid email address.' }).trim(),

    phone: z
        .string()
        .trim()
        .min(1, { message: 'Phone number is required.' })
        .regex(/^\+?[0-9]{11}$/, {
            message: 'Please enter a valid phone number (11 digits).',
        }),

    password: z.string().min(1, { message: 'Password is required.' }),
});

export const signinSchema = z.object({
    email: z.email({ message: 'Please enter a valid email address.' }).trim(),
    password: z.string().nonempty('Please enter your password.'),
});

export type SignUpFormValues = z.infer<typeof signupSchema>;
export type SignInFormValues = z.infer<typeof signinSchema>;
