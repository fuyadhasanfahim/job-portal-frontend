import { apiSlice } from '@/redux/api/apiSlice';

export const logApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getLeadAnalytics: builder.query({
            query: (month) => ({
                url: `/logs/get-lead-analytics?month=${encodeURIComponent(
                    month || ''
                )}`,
            }),
            providesTags: ['Logs'],
        }),
        getTopUsers: builder.query({
            query: ({ page = 1, limit = 10, search = '' }) =>
                `/logs/get-top-users?page=${page}&limit=${limit}&search=${encodeURIComponent(
                    search
                )}`,
            providesTags: ['Logs', 'User'],
        }),
        // NEW: Get user lead statistics for bar chart
        getUserLeadStats: builder.query({
            query: (period = 'daily') =>
                `/logs/get-user-lead-stats?period=${encodeURIComponent(
                    period
                )}`,
            providesTags: ['Logs'],
        }),
        // NEW: Get top users pie chart data
        getTopUsersPieChart: builder.query({
            query: ({ period = 'daily', limit = 10 }) =>
                `/logs/get-top-users-pie-chart?period=${encodeURIComponent(
                    period
                )}&limit=${limit}`,
            providesTags: ['Logs'],
        }),
        // NEW: Get all users table data
        getAllUsersTable: builder.query({
            query: ({ page = 1, limit = 10, search = '' }) =>
                `/logs/get-all-users-table?page=${page}&limit=${limit}&search=${encodeURIComponent(
                    search
                )}`,
            providesTags: ['Logs', 'User'],
        }),
    }),
});

export const {
    useGetLeadAnalyticsQuery,
    useGetTopUsersQuery,
    useGetUserLeadStatsQuery,
    useGetTopUsersPieChartQuery,
    useGetAllUsersTableQuery,
} = logApi;
