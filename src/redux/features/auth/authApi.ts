import { apiSlice } from '@/redux/api/apiSlice';
import { setAccessToken, signOut } from './authSlice';

interface User {
    id: string;
    firstName: string;
    email: string;
}

interface AuthResponse {
    success: boolean;
    message?: string;
    accessToken?: string;
    user?: User;
}

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        signup: builder.mutation<
            AuthResponse,
            {
                firstName: string;
                lastName?: string;
                email: string;
                phone: string;
                password: string;
                invitationToken: string;
            }
        >({
            query: (body) => ({
                url: '/auth/sign-up',
                method: 'POST',
                body,
            }),
        }),

        signin: builder.mutation<
            AuthResponse,
            { email: string; password: string }
        >({
            query: (body) => ({
                url: '/auth/sign-in',
                method: 'POST',
                body,
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data.accessToken) {
                        dispatch(setAccessToken(data.accessToken));
                    }
                } catch {}
            },
        }),

        refreshToken: builder.mutation<
            { success: boolean; accessToken: string },
            void
        >({
            query: () => ({
                url: '/auth/refresh-token',
                method: 'POST',
                headers: {
                    'x-csrf-token':
                        typeof document !== 'undefined'
                            ? document.cookie
                                  .split('; ')
                                  .find((x) => x.startsWith('csrf_token='))
                                  ?.split('=')[1] ?? ''
                            : '',
                },
            }),
        }),

        signout: builder.mutation<{ success: boolean; message: string }, void>({
            query: () => ({
                url: '/auth/sign-out',
                method: 'POST',
                headers: {
                    'x-csrf-token':
                        typeof document !== 'undefined'
                            ? document.cookie
                                  .split('; ')
                                  .find((x) => x.startsWith('csrf_token='))
                                  ?.split('=')[1] ?? ''
                            : '',
                },
            }),
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(signOut());
                } catch {}
            },
        }),
    }),
});

export const {
    useSignupMutation,
    useSigninMutation,
    useRefreshTokenMutation,
    useSignoutMutation,
} = authApi;
