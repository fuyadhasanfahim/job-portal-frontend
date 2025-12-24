import { apiSlice } from '@/redux/api/apiSlice';

export const groupApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getGroups: builder.query({
            query: (params: { includeInactive?: boolean } | void) => ({
                url: '/groups',
                method: 'GET',
                params: params || {},
            }),
            providesTags: ['Groups'],
        }),
        getGroupById: builder.query({
            query: (id: string) => ({
                url: `/groups/${id}`,
                method: 'GET',
            }),
            providesTags: ['Groups'],
        }),
        createGroup: builder.mutation({
            query: (body: {
                name: string;
                description?: string;
                color?: string;
            }) => ({
                url: '/groups',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Groups'],
        }),
        updateGroup: builder.mutation({
            query: ({
                id,
                body,
            }: {
                id: string;
                body: {
                    name?: string;
                    description?: string;
                    color?: string;
                    isActive?: boolean;
                };
            }) => ({
                url: `/groups/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Groups'],
        }),
        deleteGroup: builder.mutation({
            query: (id: string) => ({
                url: `/groups/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Groups'],
        }),
        permanentDeleteGroup: builder.mutation({
            query: (id: string) => ({
                url: `/groups/${id}/permanent`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Groups'],
        }),
    }),
});

export const {
    useGetGroupsQuery,
    useGetGroupByIdQuery,
    useCreateGroupMutation,
    useUpdateGroupMutation,
    useDeleteGroupMutation,
    usePermanentDeleteGroupMutation,
} = groupApi;
