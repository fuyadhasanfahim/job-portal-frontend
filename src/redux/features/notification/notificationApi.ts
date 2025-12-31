import { apiSlice } from '@/redux/api/apiSlice';

export const notificationApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query({
            query: ({ page = 1, limit = 20 }) => ({
                url: '/notifications',
                method: 'GET',
                params: { page, limit },
            }),
            providesTags: ['Notifications'],
        }),
        getUnreadCount: builder.query({
            query: () => '/notifications/unread-count',
            providesTags: ['Notifications'],
        }),
        markAsRead: builder.mutation({
            query: (notificationId: string) => ({
                url: `/notifications/${notificationId}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Notifications'],
        }),
        markAllAsRead: builder.mutation({
            query: () => ({
                url: '/notifications/mark-all-read',
                method: 'PATCH',
            }),
            invalidatesTags: ['Notifications'],
        }),
        deleteNotification: builder.mutation({
            query: (notificationId: string) => ({
                url: `/notifications/${notificationId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notifications'],
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
} = notificationApi;
