'use client';

import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImportLeadsMutation } from '@/redux/features/lead/leadApi';
import { useGetGroupsQuery } from '@/redux/features/group/groupApi';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    IconLoader2,
    IconFileSpreadsheet,
    IconX,
    IconCheck,
    IconCircleDot,
    IconDatabaseImport,
    IconFileTypeXls,
    IconAlertCircle,
    IconDownload,
    IconInfoCircle,
    IconFolder,
} from '@tabler/icons-react';
import { getClientSocket } from '@/lib/clientSocket';
import type { IGroup } from '@/types/group.interface';

type ProgressPayload = {
    total: number;
    processed: number;
    percentage: number;
    inserted: number;
    duplicates: number;
    errors: number;
    remaining: number;
    stage?: 'parsing' | 'deduping' | 'inserting' | 'done';
};

type SchemaValidationError = {
    type: 'missing_required' | 'missing_contact' | 'invalid_column';
    column?: string;
    message: string;
};

type RowValidationError = {
    row: number;
    field: string;
    message: string;
};

type ValidationErrorResponse = {
    success: false;
    message: string;
    validationErrors?: SchemaValidationError[];
    rowErrors?: RowValidationError[];
    totalRowErrors?: number;
    warnings?: string[];
    detectedColumns?: string[];
    expectedColumns?: {
        required: string[];
        contactRequired: string[];
        optional: string[];
    };
};

type ImportSuccessResponse = {
    success: true;
    message: string;
    results: {
        total: number;
        validRows: number;
        successful: number;
        duplicates: number;
        skippedRows: number;
        errors: string[];
        totalErrors: number;
    };
    warnings?: string[];
    uploadId?: string;
};

export default function ImportLeadsButton() {
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const [uploadId, setUploadId] = useState<string | null>(null);
    const [progress, setProgress] = useState<ProgressPayload | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Validation state
    const [validationError, setValidationError] =
        useState<ValidationErrorResponse | null>(null);
    const [importResult, setImportResult] =
        useState<ImportSuccessResponse | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    
    // Required field options
    const [requireEmail, setRequireEmail] = useState(false);
    const [requirePhone, setRequirePhone] = useState(false);

    const [importLeads, { isLoading }] = useImportLeadsMutation();
    const { data: groupsData } = useGetGroupsQuery();
    const groups: IGroup[] = groupsData?.data || [];

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (accepted) => {
            setFiles(accepted);
            setValidationError(null);
            setImportResult(null);
        },
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                ['.xlsx'],
        },
        multiple: false,
    });

    // Subscribe to socket when uploadId is available
    useEffect(() => {
        if (!uploadId) return;

        const socket = getClientSocket();

        const onConnect = () => {
            socket.emit('import:subscribe', { uploadId });
        };

        const onSubscribed = () => setIsSubscribed(true);

        const onProgress = (p: ProgressPayload) => {
            setProgress(p);
            if (p.stage === 'done') {
                toast.success(
                    `✅ Import done — Inserted: ${p.inserted}, Duplicates: ${p.duplicates}, Errors: ${p.errors}`
                );
            }
        };

        socket.on('connect', onConnect);
        socket.on('import:subscribed', onSubscribed);
        socket.on('import:progress', onProgress);

        if (socket.connected) onConnect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('import:subscribed', onSubscribed);
            socket.off('import:progress', onProgress);
        };
    }, [uploadId]);

    const handleStartImport = async () => {
        if (files.length === 0) {
            toast.error('Please select a CSV or XLSX file first.');
            return;
        }

        setValidationError(null);
        setImportResult(null);

        try {
            const formData = new FormData();
            files.forEach((f) => formData.append('files', f));
            if (selectedGroupId && selectedGroupId !== 'none') {
                formData.append('groupId', selectedGroupId);
            }
            // Pass required field options
            formData.append('requireEmail', String(requireEmail));
            formData.append('requirePhone', String(requirePhone));

            const res = await importLeads(formData).unwrap();

            if (res.success) {
                const successRes = res as ImportSuccessResponse;
                setImportResult(successRes);

                if (successRes.uploadId) {
                    setUploadId(successRes.uploadId);
                    setProgress({
                        total: successRes.results?.total ?? 0,
                        processed: 0,
                        percentage: 0,
                        inserted: 0,
                        duplicates: 0,
                        errors: 0,
                        remaining: successRes.results?.total ?? 0,
                        stage: 'parsing',
                    });
                }

                toast.success(
                    `✅ Import completed — ${successRes.results.successful} leads imported`
                );
            }
        } catch (err) {
            console.error(err);

            // Check if it's a validation error
            const error = err as { data?: ValidationErrorResponse };
            if (error.data && error.data.success === false) {
                setValidationError(error.data);
                toast.error(error.data.message || 'Validation failed');
            } else {
                toast.error(
                    (err as Error).message || 'Import failed. Please try again.'
                );
            }
        }
    };

    const downloadTemplate = async () => {
        // Dynamic import xlsx for client-side only
        const XLSX = await import('xlsx');
        
        const headers = [
            'companyName',
            'website', 
            'country',
            'address',
            'notes',
            'status',
            'contactFirstName',
            'contactLastName',
            'contactDesignation',
            'contactEmail',
            'contactPhone',
            'contact2FirstName',
            'contact2Email',
            'contact2Phone',
        ];

        const sampleData = [
            [
                'Acme Corp',
                'https://acme.com',
                'United States',
                '123 Main St, NY',
                'Potential client',
                'new',
                'John',
                'Doe',
                'CEO',
                'john@acme.com',
                '+1234567890',
                'Jane',
                'jane@acme.com',
                '+1987654321',
            ],
            [
                'Tech Solutions',
                'https://techsol.io',
                'United Kingdom',
                '456 Oxford St, London',
                'Follow up needed',
                'new',
                'Mike',
                'Smith',
                'CTO',
                'mike@techsol.io',
                '+441234567890',
                '',
                '',
                '',
            ],
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads Template');
        
        // Set column widths
        worksheet['!cols'] = headers.map(() => ({ wch: 18 }));
        
        XLSX.writeFile(workbook, 'leads_import_template.xlsx');
    };

    const resetAll = () => {
        setFiles([]);
        setUploadId(null);
        setProgress(null);
        setIsSubscribed(false);
        setValidationError(null);
        setImportResult(null);
        setSelectedGroupId('');
        setRequireEmail(false);
        setRequirePhone(false);
        setOpen(false);
    };

    const pct = progress?.percentage ?? 0;

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) resetAll();
            }}
        >
            <DialogTrigger asChild>
                <Button>
                    <IconFileTypeXls />
                    Import Leads
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-xl w-full">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconDatabaseImport className="text-primary" />
                        Import Leads
                    </DialogTitle>
                    <DialogDescription>
                        Import leads from Excel or CSV file. Download the template for the correct format.
                    </DialogDescription>
                </DialogHeader>

                {/* Quick Start - Download Template */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2">
                        <IconInfoCircle size={18} className="text-primary" />
                        <span className="text-sm font-medium">New to importing?</span>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={downloadTemplate}
                        className="gap-1.5"
                    >
                        <IconDownload size={16} />
                        Download Excel Template
                    </Button>
                </div>

                {/* Validation Error Display */}
                {validationError && (
                    <div className="space-y-3">
                        <Alert variant="destructive">
                            <IconAlertCircle className="h-4 w-4" />
                            <AlertTitle>Import Failed</AlertTitle>
                            <AlertDescription>
                                {validationError.message}
                            </AlertDescription>
                        </Alert>

                        {/* Show errors if any */}
                        {(validationError.validationErrors?.length ?? 0) > 0 && (
                            <div className="p-3 rounded-lg border bg-red-50 text-sm">
                                <p className="font-medium text-red-800 mb-2">Issues found:</p>
                                <ul className="list-disc list-inside text-red-700 space-y-1">
                                    {validationError.validationErrors?.slice(0, 5).map((err, i) => (
                                        <li key={i}>{err.message}</li>
                                    ))}
                                </ul>
                                {(validationError.totalRowErrors ?? 0) > 5 && (
                                    <p className="text-red-600 mt-2 text-xs">
                                        +{(validationError.totalRowErrors ?? 0) - 5} more errors...
                                    </p>
                                )}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={() => {
                                setValidationError(null);
                                setFiles([]);
                            }}
                        >
                            Try again
                        </Button>
                    </div>
                )}

                {/* Import Success Result */}
                {importResult && !uploadId && (
                    <div className="space-y-4">
                        <Alert className="border-green-200 bg-green-50">
                            <IconCheck className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">
                                Import Completed
                            </AlertTitle>
                            <AlertDescription className="text-green-700">
                                Successfully imported{' '}
                                {importResult.results.successful} leads out of{' '}
                                {importResult.results.total} rows.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard
                                label="Total Rows"
                                value={importResult.results.total}
                            />
                            <StatCard
                                label="Imported"
                                value={importResult.results.successful}
                                variant="success"
                            />
                            <StatCard
                                label="Duplicates"
                                value={importResult.results.duplicates}
                                variant="warning"
                            />
                            <StatCard
                                label="Skipped"
                                value={importResult.results.skippedRows}
                                variant="error"
                            />
                        </div>

                        {importResult.results.errors.length > 0 && (
                            <div className="p-3 rounded-lg border bg-amber-50">
                                <p className="font-medium text-amber-800 mb-2">
                                    Issues during import (
                                    {importResult.results.totalErrors} total):
                                </p>
                                <ScrollArea className="h-24">
                                    <ul className="text-sm text-amber-700 space-y-1">
                                        {importResult.results.errors.map(
                                            (err, i) => (
                                                <li key={i}>{err}</li>
                                            )
                                        )}
                                    </ul>
                                </ScrollArea>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={resetAll}>
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    setImportResult(null);
                                    setFiles([]);
                                }}
                            >
                                Import More
                            </Button>
                        </div>
                    </div>
                )}

                {/* File Upload - Before import */}
                {!uploadId && !validationError && !importResult && (
                    <>
                        {/* Group Selection */}
                        <div className="mb-4 space-y-2">
                            <Label className="flex items-center gap-2">
                                <IconFolder size={16} />
                                Assign to Group (Optional)
                            </Label>
                            <Select
                                value={selectedGroupId}
                                onValueChange={setSelectedGroupId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a group..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Group</SelectItem>
                                    {groups.map((group) => (
                                        <SelectItem key={group._id} value={group._id}>
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: group.color || '#6b7280' }}
                                                />
                                                {group.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Required Field Options */}
                        <div className="mb-4 p-3 rounded-lg border bg-muted/30">
                            <Label className="text-sm font-medium mb-3 block">Required Fields (Optional)</Label>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="requireEmail"
                                        checked={requireEmail}
                                        onCheckedChange={(checked) => setRequireEmail(checked === true)}
                                    />
                                    <Label htmlFor="requireEmail" className="text-sm font-normal cursor-pointer">
                                        Email Required
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="requirePhone"
                                        checked={requirePhone}
                                        onCheckedChange={(checked) => setRequirePhone(checked === true)}
                                    />
                                    <Label htmlFor="requirePhone" className="text-sm font-normal cursor-pointer">
                                        Phone Required
                                    </Label>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Rows missing checked fields will be skipped during import.
                            </p>
                        </div>

                        {files.length === 0 ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${isDragActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted-foreground/40 hover:border-primary/60'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <IconFileSpreadsheet className="w-12 h-12 text-muted-foreground" />
                                {isDragActive ? (
                                    <p className="text-primary font-medium">
                                        Drop file here…
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">
                                        Drag & drop file here, or click to
                                        select
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-stone-50 text-sm shadow-sm">
                                    {files[0].name}
                                    <button
                                        onClick={() => setFiles([])}
                                        className="text-stone-500 hover:text-red-500"
                                    >
                                        <IconX size={16} />
                                    </button>
                                </span>

                                <Button
                                    onClick={handleStartImport}
                                    disabled={isLoading}
                                    variant="default"
                                    className="flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <IconLoader2 className="animate-spin" />
                                    ) : (
                                        <>🚀 Start Import</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* After import — live progress */}
                {uploadId && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <div className="font-medium">
                                    Upload ID:{' '}
                                    <span className="font-mono">
                                        {uploadId.slice(0, 8)}…
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    {isSubscribed ? (
                                        <>
                                            <IconCheck
                                                className="text-green-500"
                                                size={16}
                                            />{' '}
                                            Connected
                                        </>
                                    ) : (
                                        <>
                                            <IconLoader2
                                                className="animate-spin text-yellow-500"
                                                size={16}
                                            />{' '}
                                            Connecting…
                                        </>
                                    )}
                                </div>
                            </div>

                            <Button variant="secondary" onClick={resetAll}>
                                New Import
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span className="flex items-center gap-2">
                                    {progress?.stage === 'parsing' && (
                                        <IconDatabaseImport
                                            size={16}
                                            className="text-blue-500"
                                        />
                                    )}
                                    {progress?.stage === 'deduping' && (
                                        <IconCircleDot
                                            size={16}
                                            className="text-purple-500"
                                        />
                                    )}
                                    {progress?.stage === 'inserting' && (
                                        <IconLoader2
                                            size={16}
                                            className="animate-spin text-indigo-500"
                                        />
                                    )}
                                    {progress?.stage === 'done' && (
                                        <IconCheck
                                            size={16}
                                            className="text-green-600"
                                        />
                                    )}
                                    {progress?.stage ?? '—'}
                                </span>
                                <span>{pct}%</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <StatCard
                                label="Total"
                                value={progress?.total ?? 0}
                            />
                            <StatCard
                                label="Processed"
                                value={progress?.processed ?? 0}
                            />
                            <StatCard
                                label="Inserted"
                                value={progress?.inserted ?? 0}
                            />
                            <StatCard
                                label="Duplicates"
                                value={progress?.duplicates ?? 0}
                            />
                            <StatCard
                                label="Errors"
                                value={progress?.errors ?? 0}
                            />
                            <StatCard
                                label="Remaining"
                                value={progress?.remaining ?? 0}
                            />
                        </div>

                        {progress?.stage === 'done' && (
                            <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                                <IconCheck size={18} /> Import completed. You
                                can close this dialog or start a new import.
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function StatCard({
    label,
    value,
    variant = 'default',
}: {
    label: string;
    value: number | string;
    variant?: 'default' | 'success' | 'warning' | 'error';
}) {
    const variantStyles = {
        default: 'bg-white',
        success: 'bg-green-50 border-green-200',
        warning: 'bg-amber-50 border-amber-200',
        error: 'bg-red-50 border-red-200',
    };

    return (
        <div
            className={`p-3 rounded-lg border flex flex-col items-start ${variantStyles[variant]}`}
        >
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
        </div>
    );
}
