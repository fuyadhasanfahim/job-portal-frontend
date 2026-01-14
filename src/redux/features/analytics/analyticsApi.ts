import { apiSlice } from '@/redux/api/apiSlice';

interface DateRangeParams {
    startDate?: string;
    endDate?: string;
}

export const analyticsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAnalyticsOverview: builder.query({
            query: (params: DateRangeParams = {}) => {
                const searchParams = new URLSearchParams();
                if (params.startDate)
                    searchParams.append('startDate', params.startDate);
                if (params.endDate)
                    searchParams.append('endDate', params.endDate);
                return `/analytics/overview?${searchParams.toString()}`;
            },
            providesTags: ['Analytics'],
        }),
        getLeadStatusDistribution: builder.query({
            query: (params: DateRangeParams = {}) => {
                const searchParams = new URLSearchParams();
                if (params.startDate)
                    searchParams.append('startDate', params.startDate);
                if (params.endDate)
                    searchParams.append('endDate', params.endDate);
                return `/analytics/lead-status?${searchParams.toString()}`;
            },
            providesTags: ['Analytics'],
        }),
        getLeadTrends: builder.query({
            query: (params: DateRangeParams & { period?: string } = {}) => {
                const searchParams = new URLSearchParams();
                if (params.startDate)
                    searchParams.append('startDate', params.startDate);
                if (params.endDate)
                    searchParams.append('endDate', params.endDate);
                if (params.period) searchParams.append('period', params.period);
                return `/analytics/lead-trends?${searchParams.toString()}`;
            },
            providesTags: ['Analytics'],
        }),
        getTaskPerformance: builder.query({
            query: (params: DateRangeParams = {}) => {
                const searchParams = new URLSearchParams();
                if (params.startDate)
                    searchParams.append('startDate', params.startDate);
                if (params.endDate)
                    searchParams.append('endDate', params.endDate);
                return `/analytics/task-performance?${searchParams.toString()}`;
            },
            providesTags: ['Analytics'],
        }),
        getUserPerformance: builder.query({
            query: (params: DateRangeParams & { limit?: number } = {}) => {
                const searchParams = new URLSearchParams();
                if (params.startDate)
                    searchParams.append('startDate', params.startDate);
                if (params.endDate)
                    searchParams.append('endDate', params.endDate);
                if (params.limit)
                    searchParams.append('limit', params.limit.toString());
                return `/analytics/user-performance?${searchParams.toString()}`;
            },
            providesTags: ['Analytics'],
        }),
        getSourceBreakdown: builder.query({
            query: (params: DateRangeParams = {}) => {
                const searchParams = new URLSearchParams();
                if (params.startDate)
                    searchParams.append('startDate', params.startDate);
                if (params.endDate)
                    searchParams.append('endDate', params.endDate);
                return `/analytics/sources?${searchParams.toString()}`;
            },
            providesTags: ['Analytics'],
        }),
        getCountryDistribution: builder.query({
            query: (params: DateRangeParams & { limit?: number } = {}) => {
                const searchParams = new URLSearchParams();
                if (params.startDate)
                    searchParams.append('startDate', params.startDate);
                if (params.endDate)
                    searchParams.append('endDate', params.endDate);
                if (params.limit)
                    searchParams.append('limit', params.limit.toString());
                return `/analytics/countries?${searchParams.toString()}`;
            },
            providesTags: ['Analytics'],
        }),
        getTodaysWork: builder.query({
            query: (
                params: DateRangeParams & {
                    userId?: string;
                    status?: string;
                    groupId?: string;
                    page?: number;
                    limit?: number;
                } = {}
            ) => {
                const searchParams = new URLSearchParams();
                if (params.startDate)
                    searchParams.append('startDate', params.startDate);
                if (params.endDate)
                    searchParams.append('endDate', params.endDate);
                if (params.userId) searchParams.append('userId', params.userId);
                if (params.status) searchParams.append('status', params.status);
                if (params.groupId)
                    searchParams.append('groupId', params.groupId);
                if (params.page)
                    searchParams.append('page', params.page.toString());
                if (params.limit)
                    searchParams.append('limit', params.limit.toString());
                return `/analytics/todays-work?${searchParams.toString()}`;
            },
            providesTags: ['Analytics'],
        }),
    }),
});

export const {
    useGetAnalyticsOverviewQuery,
    useGetLeadStatusDistributionQuery,
    useGetLeadTrendsQuery,
    useGetTaskPerformanceQuery,
    useGetUserPerformanceQuery,
    useGetSourceBreakdownQuery,
    useGetCountryDistributionQuery,
    useGetTodaysWorkQuery,
} = analyticsApi;
