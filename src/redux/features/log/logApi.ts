import { apiSlice } from '@/redux/api/apiSlice';

export const logApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getLogs: builder.query({
            query: (queryParams) => `/logs/get-logs?${queryParams.join('&')}`,
            providesTags: ['Logs'],
        }),
    }),
});

export const { useGetLogsQuery } = logApi;
