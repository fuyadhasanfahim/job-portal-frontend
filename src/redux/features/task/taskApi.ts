import { apiSlice } from '@/redux/api/apiSlice';

export const taskApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createTask: builder.mutation({
            query: (data) => ({
                url: '/tasks/create-task',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Tasks', 'Leads'],
        }),
        getTasks: builder.query({
            query: ({ page, limit, selectedUserId, status, date }) => ({
                url: '/tasks/get-tasks',
                params: {
                    page,
                    limit,
                    selectedUserId,
                    status,
                    date,
                },
            }),
            providesTags: ['Tasks'],
        }),
        getTaskById: builder.query({
            query: (id) => `/tasks/get-task/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Tasks', id }],
        }),
        updateTaskWithLead: builder.mutation({
            query: ({ taskId, leadId, body }) => ({
                url: `/tasks/update-task-with-lead/${taskId}/${leadId}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _error, { taskId }) => [
                { type: 'Tasks', id: taskId },
                'Tasks',
            ],
        }),
        forceCompleteTask: builder.mutation({
            query: ({ taskId }) => ({
                url: `/tasks/${taskId}/force-complete`,
                method: 'PUT',
            }),
            invalidatesTags: (_result, _error, { taskId }) => [
                { type: 'Tasks', id: taskId },
                'Tasks',
                'Leads',
            ],
        }),
        removeLeadFromTask: builder.mutation<
            { success: boolean; task: unknown },
            { taskId: string; leadId: string }
        >({
            query: ({ taskId, leadId }) => ({
                url: `/tasks/${taskId}/leads/${leadId}`,
                method: 'DELETE',
            }),
            // Optimistic update - no page reload, smooth removal
            async onQueryStarted({ taskId, leadId }, { dispatch, queryFulfilled }) {
                // Optimistically update the cache
                const patchResult = dispatch(
                    taskApi.util.updateQueryData('getTaskById', taskId, (draft) => {
                        if (draft?.leads) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            draft.leads = draft.leads.filter((lead: any) => lead._id !== leadId);
                        }
                        if (draft?.task?.metrics) {
                            const currentTotal = draft.task.metrics.total || 0;
                            draft.task.metrics.total = Math.max(0, currentTotal - 1);
                            draft.task.progress = draft.task.metrics.total > 0 
                                ? Math.min(100, Math.round((draft.task.metrics.done / draft.task.metrics.total) * 100))
                                : 0;
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    // Revert optimistic update on error
                    patchResult.undo();
                }
            },
            invalidatesTags: ['Leads'],
        }),
    }),
});

export const {
    useCreateTaskMutation,
    useGetTasksQuery,
    useGetTaskByIdQuery,
    useUpdateTaskWithLeadMutation,
    useForceCompleteTaskMutation,
    useRemoveLeadFromTaskMutation,
} = taskApi;
