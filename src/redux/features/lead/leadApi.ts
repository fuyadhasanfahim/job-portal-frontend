import { apiSlice } from '@/redux/api/apiSlice';

export const leadApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        importLeads: builder.mutation({
            query: (formData) => ({
                url: '/leads/import-leads',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Leads'],
        }),
        getLeads: builder.query({
            query: ({
                page,
                limit,
                search,
                status,
                sortBy,
                sortOrder,
                country,
                date,
                selectedUserId,
                group,
                source,
            }) => ({
                url: '/leads/get-leads',
                method: 'GET',
                params: {
                    page,
                    limit,
                    search,
                    status,
                    sortBy,
                    sortOrder,
                    country,
                    date,
                    selectedUserId,
                    group,
                    source,
                },
            }),
            providesTags: ['Leads'],
        }),
        getLeadsByDate: builder.query({
            query: ({ page, limit, date }) => ({
                url: '/leads/get-leads-by-date',
                method: 'GET',
                params: {
                    page,
                    limit,
                    date,
                },
            }),
            providesTags: ['Leads'],
        }),
        getLeadById: builder.query({
            query: (id: string) => ({
                url: `/leads/get-lead/${id}`,
                method: 'GET',
            }),
            providesTags: ['Leads'],
        }),
        newLead: builder.mutation({
            query: (body) => ({
                url: '/leads/new-lead',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            }),
            invalidatesTags: ['Leads'],
        }),
        updateLead: builder.mutation({
            query: ({ id, body }) => ({
                url: `/leads/update-lead/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Leads'],
        }),
        deleteLead: builder.mutation({
            query: ({ id, reason }: { id: string; reason?: string }) => ({
                url: `/leads/${id}`,
                method: 'DELETE',
                body: { reason },
            }),
            invalidatesTags: ['Leads'],
        }),
        searchLeadByCompany: builder.query({
            query: ({
                name,
                website,
            }: {
                name?: string;
                website?: string;
            }) => ({
                url: '/leads/search-by-company',
                method: 'GET',
                params: { name, website },
            }),
        }),
        addContactPerson: builder.mutation({
            query: ({
                leadId,
                contactPerson,
            }: {
                leadId: string;
                contactPerson: unknown;
            }) => ({
                url: `/leads/${leadId}/add-contact-person`,
                method: 'POST',
                body: contactPerson,
            }),
            invalidatesTags: ['Leads'],
        }),
        bulkAssignLeads: builder.mutation({
            query: ({
                leadIds,
                targetUserId,
            }: {
                leadIds: string[];
                targetUserId: string;
            }) => ({
                url: '/leads/bulk-assign',
                method: 'POST',
                body: { leadIds, targetUserId },
            }),
            invalidatesTags: ['Leads'],
        }),
        getAllMatchingLeadIds: builder.query({
            query: ({
                search,
                status,
                country,
                selectedUserId,
                group,
            }: {
                search?: string;
                status?: string;
                country?: string;
                selectedUserId?: string;
                group?: string;
            }) => ({
                url: '/leads/get-all-matching-ids',
                method: 'GET',
                params: { search, status, country, selectedUserId, group },
            }),
        }),
        bulkChangeGroup: builder.mutation({
            query: ({
                leadIds,
                targetGroupId,
            }: {
                leadIds: string[];
                targetGroupId: string | null;
            }) => ({
                url: '/leads/bulk-change-group',
                method: 'POST',
                body: { leadIds, targetGroupId },
            }),
            invalidatesTags: ['Leads'],
        }),
    }),
});

export const {
    useGetLeadsQuery,
    useGetLeadsByDateQuery,
    useGetLeadByIdQuery,
    useImportLeadsMutation,
    useNewLeadMutation,
    useUpdateLeadMutation,
    useDeleteLeadMutation,
    useLazySearchLeadByCompanyQuery,
    useAddContactPersonMutation,
    useBulkAssignLeadsMutation,
    useLazyGetAllMatchingLeadIdsQuery,
    useBulkChangeGroupMutation,
} = leadApi;
