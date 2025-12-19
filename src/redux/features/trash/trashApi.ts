import { apiSlice } from '@/redux/api/apiSlice';

export const trashApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTrashedLeads: builder.query({
            query: ({ page = 1, limit = 10, search = '', sortBy = 'deletedAt', sortOrder = 'desc' }) => ({
                url: '/trash',
                method: 'GET',
                params: { page, limit, search, sortBy, sortOrder },
            }),
            providesTags: ['Trash'],
        }),
        restoreLead: builder.mutation({
            query: (id: string) => ({
                url: `/trash/${id}/restore`,
                method: 'POST',
            }),
            invalidatesTags: ['Trash', 'Leads'],
        }),
        permanentDeleteLead: builder.mutation({
            query: (id: string) => ({
                url: `/trash/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Trash'],
        }),
    }),
});

export const {
    useGetTrashedLeadsQuery,
    useRestoreLeadMutation,
    usePermanentDeleteLeadMutation,
} = trashApi;
