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
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

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

type ImportErrorRow = {
    rowNumber: number;
    companyName?: string;
    website?: string;
    contactEmail?: string;
    country?: string;
    errorType: 'validation' | 'duplicate' | 'processing';
    errorMessage: string;
};

type ImportSuccessResponse = {
    success: true;
    message: string;
    results: {
        total: number;
        validRows: number;
        successful: number; // New leads created
        merged: number; // Contacts merged into existing leads
        duplicatesInFile: number; // Same company rows in file
        duplicatesInDb: number; // Already existed, no new contacts
        skippedRows: number; // Validation errors
        errors: string[];
        totalErrors: number;
        errorRows?: ImportErrorRow[];
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

    // Upload progress tracking
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Auth token
    const token = useSelector((state: RootState) => state.auth.accessToken);

    const [importLeads] = useImportLeadsMutation();
    const { data: groupsData } = useGetGroupsQuery();
    const groups: IGroup[] = groupsData?.data || [];

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (accepted) => {
            setFiles((prev) => [...prev, ...accepted]);
            setValidationError(null);
            setImportResult(null);
        },
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                ['.xlsx'],
        },
        multiple: true, // Enable multi-file upload
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

    // Update elapsed time every second during import
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    useEffect(() => {
        if (!isUploading || !uploadStartTime) {
            setElapsedSeconds(0);
            return;
        }
        const interval = setInterval(() => {
            setElapsedSeconds(
                Math.floor((Date.now() - uploadStartTime) / 1000)
            );
        }, 1000);
        return () => clearInterval(interval);
    }, [isUploading, uploadStartTime]);

    const handleStartImport = async () => {
        if (files.length === 0) {
            toast.error('Please select a CSV or XLSX file first.');
            return;
        }

        setValidationError(null);
        setImportResult(null);
        setUploadStartTime(Date.now());
        setUploadProgress(0);
        setIsUploading(true);

        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        if (selectedGroupId && selectedGroupId !== 'none') {
            formData.append('groupId', selectedGroupId);
        }
        formData.append('requireEmail', String(requireEmail));
        formData.append('requirePhone', String(requirePhone));

        // Use XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percent);
            }
        });

        xhr.addEventListener('load', () => {
            setIsUploading(false);
            setUploadStartTime(null);

            try {
                const res = JSON.parse(xhr.responseText);
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
                        `✅ Import completed — ${successRes.results.successful} new leads, ${successRes.results.merged} merged`
                    );
                } else {
                    setValidationError(res);
                    toast.error(res.message || 'Validation failed');
                }
            } catch {
                toast.error('Failed to parse server response');
            }
        });

        xhr.addEventListener('error', () => {
            setIsUploading(false);
            setUploadStartTime(null);
            toast.error('Upload failed. Please try again.');
        });

        const baseUrl = process.env.NEXT_PUBLIC_API_URL + '/api/v1';
        xhr.open('POST', `${baseUrl}/leads/import-leads`);

        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        // Need to set withCredentials for cookies if used
        xhr.withCredentials = true;

        xhr.send(formData);
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

    const downloadErrorsExcel = async () => {
        if (
            !importResult?.results?.errorRows ||
            importResult.results.errorRows.length === 0
        ) {
            return;
        }

        const XLSX = await import('xlsx');

        const headers = [
            'Row Number',
            'Company Name',
            'Website',
            'Contact Email',
            'Country',
            'Error Type',
            'Error Message',
        ];

        const data = importResult.results.errorRows.map((row) => [
            row.rowNumber,
            row.companyName || '',
            row.website || '',
            row.contactEmail || '',
            row.country || '',
            row.errorType,
            row.errorMessage,
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Errors');

        // Set column widths
        worksheet['!cols'] = [
            { wch: 10 }, // Row Number
            { wch: 25 }, // Company Name
            { wch: 25 }, // Website
            { wch: 30 }, // Contact Email
            { wch: 15 }, // Country
            { wch: 12 }, // Error Type
            { wch: 50 }, // Error Message
        ];

        XLSX.writeFile(workbook, 'import_errors.xlsx');
    };

    const downloadLogFile = () => {
        if (!importResult) return;

        const now = new Date();
        const dateStr = now.toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' });
        const r = importResult.results;

        const logContent = `
========================================
       LEAD IMPORT LOG
========================================
Date/Time: ${dateStr}
File Name: ${files[0]?.name || 'Unknown'}

----------------------------------------
              SUMMARY
----------------------------------------
Total Rows in File:           ${r.total}
Valid Rows:                   ${r.validRows}

✅ New Leads Created:         ${r.successful}
🔄 Merged (contacts added):   ${r.merged}
📁 Duplicates in File:        ${r.duplicatesInFile}
   (same company, different rows)
🚫 Duplicates in Database:    ${r.duplicatesInDb}
   (already exists, no new info)
⚠️ Skipped (validation):      ${r.skippedRows}

----------------------------------------
           FINAL COUNTS
----------------------------------------
New Leads in System:          ${r.successful}
Total Contacts Merged:        ${r.merged}
Total Skipped/Errors:         ${r.duplicatesInDb + r.skippedRows}

----------------------------------------
           ERROR DETAILS
----------------------------------------
${r.errors.length > 0 ? r.errors.join('\n') : 'No errors'}

========================================
       END OF LOG
========================================
`.trim();

        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `import_log_${now.toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                        Import leads from Excel or CSV file. Download the
                        template for the correct format.
                    </DialogDescription>
                </DialogHeader>

                {/* Quick Start - Download Template */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2">
                        <IconInfoCircle size={18} className="text-primary" />
                        <span className="text-sm font-medium">
                            New to importing?
                        </span>
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
                        {(validationError.validationErrors?.length ?? 0) >
                            0 && (
                            <div className="p-3 rounded-lg border bg-red-50 text-sm">
                                <p className="font-medium text-red-800 mb-2">
                                    Issues found:
                                </p>
                                <ul className="list-disc list-inside text-red-700 space-y-1">
                                    {validationError.validationErrors
                                        ?.slice(0, 5)
                                        .map((err, i) => (
                                            <li key={i}>{err.message}</li>
                                        ))}
                                </ul>
                                {(validationError.totalRowErrors ?? 0) > 5 && (
                                    <p className="text-red-600 mt-2 text-xs">
                                        +
                                        {(validationError.totalRowErrors ?? 0) -
                                            5}{' '}
                                        more errors...
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

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <StatCard
                                label="Total Rows"
                                value={importResult.results.total}
                            />
                            <StatCard
                                label="New Leads Created"
                                value={importResult.results.successful}
                                variant="success"
                            />
                            <StatCard
                                label="Merged"
                                value={importResult.results.merged}
                                variant="success"
                            />
                            <StatCard
                                label="Duplicate (File)"
                                value={importResult.results.duplicatesInFile}
                                variant="warning"
                            />
                            <StatCard
                                label="Duplicate (DB)"
                                value={importResult.results.duplicatesInDb}
                                variant="warning"
                            />
                            <StatCard
                                label="Skipped"
                                value={importResult.results.skippedRows}
                                variant="error"
                            />
                        </div>

                        {/* Explanation */}
                        <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/50">
                            <p>
                                <strong>New Leads:</strong> Brand new leads
                                created in the system
                            </p>
                            <p>
                                <strong>Merged:</strong> New contacts added to
                                existing leads
                            </p>
                            <p>
                                <strong>Duplicate (File):</strong> Same company
                                appeared multiple times in file
                            </p>
                            <p>
                                <strong>Duplicate (DB):</strong> Already exists
                                in database with no new info
                            </p>
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

                        {/* Download Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="default"
                                onClick={downloadLogFile}
                                className="gap-2"
                            >
                                <IconDownload size={16} />
                                Download Log (TXT)
                            </Button>
                            {(importResult.results.errorRows?.length ?? 0) >
                                0 && (
                                <Button
                                    variant="outline"
                                    onClick={downloadErrorsExcel}
                                    className="gap-2"
                                >
                                    <IconDownload size={16} />
                                    Download Errors (Excel)
                                </Button>
                            )}
                        </div>

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
                                    <SelectItem value="none">
                                        No Group
                                    </SelectItem>
                                    {groups.map((group) => (
                                        <SelectItem
                                            key={group._id}
                                            value={group._id}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            group.color ||
                                                            '#6b7280',
                                                    }}
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
                            <Label className="text-sm font-medium mb-3 block">
                                Required Fields (Optional)
                            </Label>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="requireEmail"
                                        checked={requireEmail}
                                        onCheckedChange={(checked) =>
                                            setRequireEmail(checked === true)
                                        }
                                    />
                                    <Label
                                        htmlFor="requireEmail"
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        Email Required
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="requirePhone"
                                        checked={requirePhone}
                                        onCheckedChange={(checked) =>
                                            setRequirePhone(checked === true)
                                        }
                                    />
                                    <Label
                                        htmlFor="requirePhone"
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        Phone Required
                                    </Label>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Rows missing checked fields will be skipped
                                during import.
                            </p>
                        </div>

                        {files.length === 0 ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                                    isDragActive
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
                        ) : isUploading ? (
                            <div className="space-y-4">
                                {/* Progress Display During Import */}
                                <div className="p-4 rounded-lg border bg-primary/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <IconLoader2
                                                className="animate-spin text-primary"
                                                size={24}
                                            />
                                            <div>
                                                <p className="font-medium">
                                                    Uploading & Processing...
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {files.length} file(s) -{' '}
                                                    {files
                                                        .map((f) => f.name)
                                                        .join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xl font-bold text-primary">
                                            {uploadProgress}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{
                                                width: `${uploadProgress}%`,
                                            }}
                                        />
                                    </div>

                                    {/* Info Row */}
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>
                                            {uploadProgress < 100
                                                ? 'Uploading...'
                                                : 'Processing on server...'}
                                        </span>
                                        <div className="flex gap-4">
                                            <span>
                                                Elapsed: {elapsedSeconds}s
                                            </span>
                                            {uploadProgress > 0 &&
                                                uploadProgress < 100 &&
                                                elapsedSeconds > 0 && (
                                                    <span>
                                                        ETA:{' '}
                                                        {Math.round(
                                                            (elapsedSeconds /
                                                                uploadProgress) *
                                                                (100 -
                                                                    uploadProgress)
                                                        )}
                                                        s
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-center text-muted-foreground">
                                    Please wait while we process your file(s).
                                    This may take a moment for large files.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Selected Files List */}
                                <div className="flex flex-wrap gap-2">
                                    {files.map((file, idx) => (
                                        <span
                                            key={idx}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-stone-50 text-sm shadow-sm"
                                        >
                                            <IconFileSpreadsheet
                                                size={16}
                                                className="text-primary"
                                            />
                                            {file.name}
                                            <button
                                                onClick={() =>
                                                    setFiles(
                                                        files.filter(
                                                            (_, i) => i !== idx
                                                        )
                                                    )
                                                }
                                                className="text-stone-500 hover:text-red-500"
                                            >
                                                <IconX size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {/* Add More & Start */}
                                <div className="flex items-center justify-between">
                                    <div
                                        {...getRootProps()}
                                        className="text-sm text-primary cursor-pointer hover:underline flex items-center gap-1"
                                    >
                                        <input {...getInputProps()} />+ Add more
                                        files
                                    </div>

                                    <Button
                                        onClick={handleStartImport}
                                        disabled={isUploading}
                                        variant="default"
                                        className="flex items-center gap-2"
                                    >
                                        🚀 Import {files.length} file(s)
                                    </Button>
                                </div>
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
