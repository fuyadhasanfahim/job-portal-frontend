'use client';

import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImportLeadsMutation } from '@/redux/features/lead/leadApi';
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    IconLoader2,
    IconFileSpreadsheet,
    IconX,
    IconCheck,
    IconCircleDot,
    IconDatabaseImport,
    IconFileTypeXls,
    IconAlertTriangle,
    IconAlertCircle,
    IconDownload,
    IconInfoCircle,
} from '@tabler/icons-react';
import { getClientSocket } from '@/lib/clientSocket';

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

const EXPECTED_COLUMNS = {
    required: ['companyName', 'country'],
    contactRequired: ['contactEmail', 'contactPhone'],
    optional: [
        'website',
        'address',
        'notes',
        'status',
        'contactFirstName',
        'contactLastName',
        'contactDesignation',
        'additionalContacts',
    ],
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

    const [importLeads, { isLoading }] = useImportLeadsMutation();

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

    const downloadTemplate = () => {
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
        ];

        const sampleData = [
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
        ];

        const csvContent = [headers.join(','), sampleData.join(',')].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'leads_import_template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const resetAll = () => {
        setFiles([]);
        setUploadId(null);
        setProgress(null);
        setIsSubscribed(false);
        setValidationError(null);
        setImportResult(null);
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

            <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconDatabaseImport className="text-primary" />
                        Import Leads
                    </DialogTitle>
                    <DialogDescription>
                        Upload CSV or Excel file to import leads. Make sure your
                        file has the required columns.
                    </DialogDescription>
                </DialogHeader>

                {/* Expected Format Info */}
                <Accordion type="single" collapsible className="mb-4">
                    <AccordionItem value="format">
                        <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                                <IconInfoCircle size={16} />
                                Expected File Format
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="font-medium text-red-600 mb-1">
                                        Required Columns:
                                    </p>
                                    <ul className="list-disc list-inside text-muted-foreground">
                                        {EXPECTED_COLUMNS.required.map(
                                            (col) => (
                                                <li key={col}>
                                                    <code className="bg-stone-100 px-1 rounded">
                                                        {col}
                                                    </code>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-medium text-amber-600 mb-1">
                                        At Least One Required:
                                    </p>
                                    <ul className="list-disc list-inside text-muted-foreground">
                                        {EXPECTED_COLUMNS.contactRequired.map(
                                            (col) => (
                                                <li key={col}>
                                                    <code className="bg-stone-100 px-1 rounded">
                                                        {col}
                                                    </code>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-medium text-green-600 mb-1">
                                        Optional Columns:
                                    </p>
                                    <ul className="list-disc list-inside text-muted-foreground">
                                        {EXPECTED_COLUMNS.optional.map(
                                            (col) => (
                                                <li key={col}>
                                                    <code className="bg-stone-100 px-1 rounded">
                                                        {col}
                                                    </code>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadTemplate}
                                    className="mt-2"
                                >
                                    <IconDownload size={16} />
                                    Download Template CSV
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

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

                        {/* Schema Validation Errors */}
                        {validationError.validationErrors &&
                            validationError.validationErrors.length > 0 && (
                                <Alert variant="destructive">
                                    <IconAlertTriangle className="h-4 w-4" />
                                    <AlertTitle>
                                        Missing Required Columns
                                    </AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc list-inside mt-2">
                                            {validationError.validationErrors.map(
                                                (err, i) => (
                                                    <li key={i}>
                                                        {err.message}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                        {/* Detected vs Expected Columns */}
                        {validationError.detectedColumns && (
                            <div className="p-3 rounded-lg border bg-stone-50 text-sm">
                                <p className="font-medium mb-2">
                                    Columns found in your file:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {validationError.detectedColumns.map(
                                        (col) => (
                                            <span
                                                key={col}
                                                className="px-2 py-0.5 bg-stone-200 rounded text-xs"
                                            >
                                                {col}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Row-level Errors */}
                        {validationError.rowErrors &&
                            validationError.rowErrors.length > 0 && (
                                <div className="p-3 rounded-lg border bg-red-50">
                                    <p className="font-medium text-red-800 mb-2">
                                        Row Validation Errors (
                                        {validationError.totalRowErrors} total):
                                    </p>
                                    <ScrollArea className="h-32">
                                        <ul className="text-sm text-red-700 space-y-1">
                                            {validationError.rowErrors.map(
                                                (err, i) => (
                                                    <li key={i}>
                                                        {err.message}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </ScrollArea>
                                </div>
                            )}

                        {/* Warnings */}
                        {validationError.warnings &&
                            validationError.warnings.length > 0 && (
                                <Alert>
                                    <IconAlertTriangle className="h-4 w-4 text-amber-500" />
                                    <AlertTitle>Warnings</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc list-inside mt-1">
                                            {validationError.warnings.map(
                                                (w, i) => (
                                                    <li key={i}>{w}</li>
                                                )
                                            )}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                        <Button
                            variant="outline"
                            onClick={() => {
                                setValidationError(null);
                                setFiles([]);
                            }}
                        >
                            Try a different file
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
