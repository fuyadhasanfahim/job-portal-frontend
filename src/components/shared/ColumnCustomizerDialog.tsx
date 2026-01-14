'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    getTableColumnsConfig,
    type TablePreferencePage,
    type TableColumn,
} from '@/data/tableColumnConfig';
import { useUpdateTablePreferencesMutation } from '@/redux/features/user/userApi';
import { useSignedUser } from '@/hooks/useSignedUser';

interface ColumnCustomizerDialogProps {
    page: TablePreferencePage;
    onColumnsChange?: (columns: string[]) => void;
}

export function ColumnCustomizerDialog({
    page,
    onColumnsChange,
}: ColumnCustomizerDialogProps) {
    const [open, setOpen] = useState(false);
    const { user } = useSignedUser();
    const [updatePreferences, { isLoading }] =
        useUpdateTablePreferencesMutation();

    const { columns: availableColumns, defaults } = getTableColumnsConfig(page);

    // Get saved preferences or use defaults
    const savedColumns = user?.tablePreferences?.[page] ?? defaults;

    const [selectedColumns, setSelectedColumns] =
        useState<string[]>(savedColumns);

    // Update selected columns when user preferences change
    useEffect(() => {
        const userColumns = user?.tablePreferences?.[page];
        if (userColumns && userColumns.length > 0) {
            setSelectedColumns(userColumns);
        } else {
            setSelectedColumns(defaults);
        }
    }, [user?.tablePreferences, page, defaults]);

    const handleToggleColumn = (columnKey: string, column: TableColumn) => {
        // Don't allow unchecking required columns
        if (column.required) return;

        setSelectedColumns((prev) => {
            if (prev.includes(columnKey)) {
                return prev.filter((c) => c !== columnKey);
            }
            return [...prev, columnKey];
        });
    };

    const handleSave = async () => {
        try {
            await updatePreferences({
                page,
                columns: selectedColumns,
            }).unwrap();
            onColumnsChange?.(selectedColumns);
            toast.success('Column preferences saved');
            setOpen(false);
        } catch {
            toast.error('Failed to save preferences');
        }
    };

    const handleReset = () => {
        setSelectedColumns(defaults);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Settings2 className="h-4 w-4" />
                    Columns
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Customize Table Columns</DialogTitle>
                    <DialogDescription>
                        Select which columns to display in the table.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-4 max-h-[400px] overflow-y-auto">
                    {availableColumns.map((column) => (
                        <label
                            key={column.key}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                                selectedColumns.includes(column.key)
                                    ? 'bg-primary/5 border-primary/30'
                                    : 'bg-muted/30 border-transparent hover:border-muted-foreground/20'
                            } ${
                                column.required
                                    ? 'opacity-70 cursor-not-allowed'
                                    : ''
                            }`}
                        >
                            <Checkbox
                                checked={selectedColumns.includes(column.key)}
                                onCheckedChange={() =>
                                    handleToggleColumn(column.key, column)
                                }
                                disabled={column.required}
                            />
                            <span className="text-sm font-medium">
                                {column.label}
                            </span>
                            {column.required && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                    Required
                                </span>
                            )}
                        </label>
                    ))}
                </div>

                <DialogFooter className="flex-row justify-between gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        disabled={isLoading}
                    >
                        Reset to Default
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
