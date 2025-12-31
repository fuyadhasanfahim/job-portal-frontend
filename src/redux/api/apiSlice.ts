import {
    createApi,
    fetchBaseQuery,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { setAccessToken, signOut } from '../features/auth/authSlice';
import { RootState } from '../store';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL! + '/api/v1',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth?.accessToken;
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth: typeof baseQuery = async (
    args,
    api,
    extraOptions
) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && (result.error as FetchBaseQueryError).status === 401) {
        const csrf =
            typeof document !== 'undefined'
                ? document.cookie
                      .split('; ')
                      .find((x) => x.startsWith('csrf_token='))
                      ?.split('=')[1] ?? ''
                : '';

        const refreshResult = await baseQuery(
            {
                url: '/auth/refresh-token',
                method: 'POST',
                credentials: 'include',
                headers: { 'x-csrf-token': csrf },
            },
            api,
            extraOptions
        );

        if (
            refreshResult.data &&
            (refreshResult.data as { accessToken?: string }).accessToken
        ) {
            const newToken = (refreshResult.data as { accessToken: string })
                .accessToken;
            api.dispatch(setAccessToken(newToken));
            result = await baseQuery(args, api, extraOptions);
        } else {
            api.dispatch(signOut());
        }
    }

    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        'User',
        'Users',
        'Leads',
        'Tasks',
        'Logs',
        'Trash',
        'Groups',
        'Invitations',
        'Notifications',
    ],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    endpoints: (_builder) => ({}),
});
