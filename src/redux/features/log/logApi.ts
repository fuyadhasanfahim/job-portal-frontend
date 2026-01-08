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
        // NEW: Get activity logs (Admin)
        getActivityLogs: builder.query({
            query: ({ page = 1, limit = 20, search = '', userId, action, entityType, startDate, endDate, level }) => {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    search,
                });
                if (userId) params.append('userId', userId);
                if (action) params.append('action', action);
                if (entityType) params.append('entityType', entityType);
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                if (level) params.append('level', level);

                return `/logs/get-activity-logs?${params.toString()}`;
            },
            providesTags: ['Logs'],
        }),
    }),
});

export const {
    useGetLeadAnalyticsQuery,
    useGetTopUsersQuery,
    useGetUserLeadStatsQuery,
    useGetTopUsersPieChartQuery,
    useGetAllUsersTableQuery,
    useGetActivityLogsQuery,
} = logApi;
