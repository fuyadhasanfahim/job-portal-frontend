// Table column configuration for each page
// Defines available columns, their labels, and default visibility

export interface TableColumn {
    key: string;
    label: string;
    required?: boolean; // If true, column cannot be hidden
}

// Leads page columns
export const leadsTableColumns: TableColumn[] = [
    { key: 'company', label: 'Company', required: true },
    { key: 'website', label: 'Website' },
    { key: 'name', label: 'Name' },
    { key: 'emails', label: 'Emails' },
    { key: 'phones', label: 'Phones' },
    { key: 'designation', label: 'Designation' },
    { key: 'country', label: 'Country' },
    { key: 'group', label: 'Group' },
    { key: 'notes', label: 'Notes' },
    { key: 'status', label: 'Status' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'updatedBy', label: 'Updated By' },
    { key: 'actions', label: 'Actions', required: true },
];

// Create task page columns
export const createTaskTableColumns: TableColumn[] = [
    { key: 'company', label: 'Company', required: true },
    { key: 'website', label: 'Website' },
    { key: 'country', label: 'Country' },
    { key: 'phones', label: 'Phones' },
    { key: 'emails', label: 'Emails' },
    { key: 'name', label: 'Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'group', label: 'Group' },
    { key: 'status', label: 'Status' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'updatedBy', label: 'Updated By' },
];

// Schedules page columns
export const schedulesTableColumns: TableColumn[] = [
    { key: 'company', label: 'Company', required: true },
    { key: 'website', label: 'Website' },
    { key: 'country', label: 'Country' },
    { key: 'phones', label: 'Phones' },
    { key: 'emails', label: 'Emails' },
    { key: 'name', label: 'Name' },
    { key: 'scheduledDate', label: 'Scheduled Date' },
    { key: 'nextAction', label: 'Next Action' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' },
    { key: 'group', label: 'Group' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'updatedBy', label: 'Updated By' },
    { key: 'actions', label: 'Actions', required: true },
];

// Task details page columns
export const taskDetailsTableColumns: TableColumn[] = [
    { key: 'company', label: 'Company', required: true },
    { key: 'website', label: 'Website' },
    { key: 'country', label: 'Country' },
    { key: 'phones', label: 'Phones' },
    { key: 'emails', label: 'Emails' },
    { key: 'name', label: 'Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'group', label: 'Group' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Notes' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'updatedAt', label: 'Updated At' },
    { key: 'updatedBy', label: 'Updated By' },
    { key: 'actions', label: 'Actions', required: true },
];

// Default visible columns for each page (used when no preference is saved)
export const defaultLeadsColumns = [
    'company',
    'website',
    'name',
    'emails',
    'designation',
    'country',
    'group',
    'notes',
    'actions',
];
export const defaultCreateTaskColumns = [
    'company',
    'website',
    'country',
    'phones',
    'emails',
    'name',
    'status',
];
export const defaultSchedulesColumns = [
    'company',
    'country',
    'phones',
    'emails',
    'scheduledDate',
    'nextAction',
    'status',
    'notes',
    'actions',
];
export const defaultTaskDetailsColumns = [
    'company',
    'country',
    'phones',
    'emails',
    'status',
    'actions',
];

// Get columns config by page name
export type TablePreferencePage =
    | 'leads'
    | 'createTask'
    | 'schedules'
    | 'taskDetails';

export function getTableColumnsConfig(page: TablePreferencePage): {
    columns: TableColumn[];
    defaults: string[];
} {
    switch (page) {
        case 'leads':
            return {
                columns: leadsTableColumns,
                defaults: defaultLeadsColumns,
            };
        case 'createTask':
            return {
                columns: createTaskTableColumns,
                defaults: defaultCreateTaskColumns,
            };
        case 'schedules':
            return {
                columns: schedulesTableColumns,
                defaults: defaultSchedulesColumns,
            };
        case 'taskDetails':
            return {
                columns: taskDetailsTableColumns,
                defaults: defaultTaskDetailsColumns,
            };
        default:
            return { columns: [], defaults: [] };
    }
}
