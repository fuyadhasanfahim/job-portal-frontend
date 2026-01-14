'use client';

import { useMemo } from 'react';
import { useSignedUser } from './useSignedUser';
import {
    getTableColumnsConfig,
    type TablePreferencePage,
} from '@/data/tableColumnConfig';

/**
 * Hook to manage table column visibility based on user preferences
 * @param page - The page name to get column preferences for
 * @returns Object with visibleColumns array and isColumnVisible function
 */
export function useTableColumns(page: TablePreferencePage) {
    const { user } = useSignedUser();
    const { columns: availableColumns, defaults } = getTableColumnsConfig(page);

    // Get visible columns from user preferences or use defaults
    const visibleColumns = useMemo(() => {
        const savedPrefs = user?.tablePreferences?.[page];
        if (savedPrefs && savedPrefs.length > 0) {
            return savedPrefs;
        }
        return defaults;
    }, [user?.tablePreferences, page, defaults]);

    // Check if a specific column should be visible
    const isColumnVisible = (columnKey: string): boolean => {
        return visibleColumns.includes(columnKey);
    };

    return {
        visibleColumns,
        isColumnVisible,
        availableColumns,
        defaults,
    };
}
