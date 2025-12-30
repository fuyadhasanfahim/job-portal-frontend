import { apiSlice } from '@/redux/api/apiSlice';

export const invitationApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Validate invitation token (public)
        validateInvitation: builder.query({
            query: (token: string) => ({
                url: `/invitations/validate/${token}`,
                method: 'GET',
            }),
        }),
        // Create invitation (admin only)
        createInvitation: builder.mutation({
            query: ({ email, role }: { email: string; role: string }) => ({
                url: '/invitations',
                method: 'POST',
                body: { email, role },
            }),
            invalidatesTags: ['Invitations'],
        }),
        // Get all invitations (admin only)
        getInvitations: builder.query({
            query: () => ({
                url: '/invitations',
                method: 'GET',
            }),
            providesTags: ['Invitations'],
        }),
        // Revoke invitation (admin only)
        revokeInvitation: builder.mutation({
            query: (id: string) => ({
                url: `/invitations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Invitations'],
        }),
        // Resend invitation (admin only)
        resendInvitation: builder.mutation({
            query: (id: string) => ({
                url: `/invitations/${id}/resend`,
                method: 'POST',
            }),
            invalidatesTags: ['Invitations'],
        }),
    }),
});

export const {
    useValidateInvitationQuery,
    useCreateInvitationMutation,
    useGetInvitationsQuery,
    useRevokeInvitationMutation,
    useResendInvitationMutation,
} = invitationApi;
