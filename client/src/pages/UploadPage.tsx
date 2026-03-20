import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Upload, X, File, FileText, FileSpreadsheet, FileImage, FileCode, CheckCircle, AlertCircle, Eye, Download, Edit2, Save, RotateCcw, FileCheck, ShieldCheck, Zap, Layers } from 'lucide-react';
import { useDocumentStore } from '../services/store';
import { exportToExcel, exportToPDF, type DocumentExportData } from '../utils/exportUtils';
import JSZip from 'jszip';
// Lazy load heavy dependencies to reduce initial bundle size
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import ExcelJS from 'exceljs';
import Modal from '../components/Modal';
import UpgradeModal from '../components/UpgradeModal';
import SEO from '../components/SEO';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface ExtractedData {
    documentNumber?: string;
    revision?: string;
    title?: string;
    issueDate?: string;
    discipline?: string;
    consultant?: string;
    status?: string;
    summary?: string;
    documentType?: string;
    confidence_score?: number;
    reasoning_notes?: string;
}

interface ResultItem {
    id: string;
    filename: string;
    data: ExtractedData;
    file: File;
    isEditing: boolean;
    isDuplicate?: boolean;
    duplicateOf?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const UploadPage = () => {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToast();
    // Global sync in App.tsx handles the initial fetch now.
    // We only need to worry about local state here.

    // ... rest of state ...
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessingUploads, setIsProcessingUploads] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);
    const [results, setResults] = useState<ResultItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [uploadErrors, setUploadErrors] = useState<{ filename: string; reason: string }[]>([]); // New consolidated error state
    const [transmittalTitle, setTransmittalTitle] = useState('');
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    // Company Settings
    const [companySettings, setCompanySettings] = useState<{ name?: string, logo?: string }>({});

    useEffect(() => {
        if (!user) return;
        const fetchSettings = async () => {
            try {
                const email = user.primaryEmailAddress?.emailAddress;
                const token = await getToken();
                const url = email ? `${API_URL}/user?email=${encodeURIComponent(email)}` : `${API_URL}/user`;
                const res = await fetch(url, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    setCompanySettings({
                        name: data.company_name,
                        logo: data.company_logo_url
                    });
                }
            } catch (err) {
                console.error('Failed to load company settings:', err);
            }
        };
        fetchSettings();
    }, [user, getToken]);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'info' | 'danger' | 'success';
        onConfirm?: () => void;
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: ''
    });

    const showModal = (title: string, message: string, type: 'info' | 'danger' | 'success' = 'info', onConfirm?: () => void, confirmText?: string) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm,
            confirmText
        });
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const isValidFile = (file: File) => {
        const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.dxf'];
        const name = file.name.toLowerCase();
        const MAX_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5MB limit for Vercel

        if (file.size > MAX_SIZE_BYTES) {
            setUploadErrors(prev => [...prev, {
                filename: file.name,
                reason: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum allowed size of 4.5MB.`
            }]);
            return false;
        }

        return allowedExtensions.some(ext => name.endsWith(ext));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processEntry = async (entry: any, fileList: File[]) => {
        if (entry.isFile) {
            await new Promise<void>((resolve) => {
                entry.file((file: File) => {
                    if (isValidFile(file) && !file.name.startsWith('._')) {
                        fileList.push(file);
                    }
                    resolve();
                });
            });
        } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const entries = await new Promise<any[]>((resolve) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                dirReader.readEntries((results: any[]) => resolve(results));
            });
            for (const nestedEntry of entries) {
                await processEntry(nestedEntry, fileList);
            }
        }
    };

    const processZip = async (zipFile: File, fileList: File[]) => {
        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(zipFile);
            const extractPromises: Promise<void>[] = [];

            contents.forEach((_relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    extractPromises.push(
                        zipEntry.async('blob').then((blob) => {
                            const extractedFile = new window.File([blob], zipEntry.name.split('/').pop() || zipEntry.name, {
                                type: blob.type || 'application/octet-stream',
                            });
                            if (isValidFile(extractedFile) && !extractedFile.name.startsWith('._')) {
                                fileList.push(extractedFile);
                            }
                        })
                    );
                }
            });
            await Promise.all(extractPromises);
        } catch (err) {
            console.error('Error extracting ZIP:', err);
            showToast('Failed to perfectly read ZIP file. Some files may be missing.', 'error');
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const newFiles: File[] = [];

        if (e.dataTransfer.items) {
            setIsProcessingUploads(true);
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                const item = e.dataTransfer.items[i];
                if (item.kind === 'file') {
                    const entry = item.webkitGetAsEntry();
                    if (entry) {
                        if (entry.isDirectory) {
                            await processEntry(entry, newFiles);
                        } else {
                            const file = item.getAsFile();
                            if (file) {
                                if (file.name.toLowerCase().endsWith('.zip')) {
                                    await processZip(file, newFiles);
                                } else if (isValidFile(file)) {
                                    newFiles.push(file);
                                }
                            }
                        }
                    }
                }
            }
            setIsProcessingUploads(false);
        } else if (e.dataTransfer.files) {
            setIsProcessingUploads(true);
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                const file = e.dataTransfer.files[i];
                if (file.name.toLowerCase().endsWith('.zip')) {
                    await processZip(file, newFiles);
                } else if (isValidFile(file)) {
                    newFiles.push(file);
                }
            }
            setIsProcessingUploads(false);
        }

        if (newFiles.length > 0) {
            setFiles(prev => [...prev, ...newFiles]);
            setError(null);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsProcessingUploads(true);
            const newFiles: File[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                if (file.name.toLowerCase().endsWith('.zip')) {
                    await processZip(file, newFiles);
                } else if (isValidFile(file)) {
                    newFiles.push(file);
                }
            }
            if (newFiles.length > 0) {
                setFiles(prev => [...prev, ...newFiles]);
                setError(null);
            }
            setIsProcessingUploads(false);
        }
    };

    const removeFile = (name: string) => {
        setFiles(files.filter(f => f.name !== name));
    }

    const { setUsage } = useDocumentStore();

    const processFiles = async () => {
        if (!user) {
            showModal('Authentication Required', 'Please sign in to upload documents.', 'danger');
            return;
        }

        setIsUploading(true);
        setIsUploading(true);
        setError(null);
        setUploadErrors([]); // Clear previous batch errors
        setProcessedCount(0);
        const newResults: ResultItem[] = [];

        // Generate Batch Title ONCE for all files
        const batchTitle = transmittalTitle.trim() || `Transmittal - ${new Date().toLocaleString()}`;

        for (const file of files) {
            const formData = new FormData();
            // Append text fields FIRST for Multer compatibility
            formData.append('userId', user.id);
            if (user.primaryEmailAddress?.emailAddress) {
                formData.append('email', user.primaryEmailAddress.emailAddress);
            }
            formData.append('transmittalTitle', batchTitle);

            // Append File LAST
            formData.append('file', file);

            try {
                const token = await getToken();

                // Add AbortController for 45-second timeout (Vercel max is often 60s, but we want to fail gracefully before the platform hard-kills it)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 45000);

                const response = await fetch(`${API_URL}/documents/upload`, {
                    method: 'POST',
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: formData,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    let errorData: Record<string, unknown> = {};
                    const text = await response.text();
                    try {
                        errorData = JSON.parse(text);
                    } catch {
                        console.error('[Upload] Non-JSON error response:', text.substring(0, 100));
                        errorData = { error: `Server error (${response.status}). The service might be timing out or unavailable.` };
                    }

                    // Handle Specific Error Cases
                    if (response.status === 400) {
                        showToast(`Analysis failed: ${file.name}`, 'error');
                        const msg = (errorData.message as string) || (errorData.error as string) || 'The AI could not read this document format.';
                        setUploadErrors(prev => [...prev, { filename: file.name, reason: msg }]);
                        continue;
                    }

                    const msg = (errorData.details as string) || (errorData.message as string) || (errorData.error as string) || `Server error during processing.`;
                    setUploadErrors(prev => [...prev, { filename: file.name, reason: msg }]);
                    continue;
                }

                const json = await response.json();

                // Update Usage Store
                if (json.usage) {
                    setUsage(json.usage.current, json.usage.limit);
                }

                // Check for duplicate within the current batch and pre-existing results
                const extractedDocNumber = json.data.documentNumber;
                const extractedRevision = json.data.revision || '';

                let isDuplicate = false;
                let duplicateOf = '';
                if (extractedDocNumber) {
                    const allCurrentResults = [...results, ...newResults];
                    const existingMatch = allCurrentResults.find(r =>
                        r.data.documentNumber === extractedDocNumber &&
                        (r.data.revision || '') === extractedRevision
                    );
                    if (existingMatch) {
                        isDuplicate = true;
                        duplicateOf = existingMatch.filename;
                    }
                }

                newResults.push({
                    id: Math.random().toString(36).substr(2, 9),
                    filename: file.name,
                    data: json.data,
                    file: file,
                    isEditing: false,
                    isDuplicate,
                    duplicateOf
                });
            } catch (err: unknown) {
                console.error('Upload failed:', err);

                // If we reach here, it's an unhandled exception or network error or timeout
                let message = err instanceof Error ? err.message : 'Connection lost or server timeout.';

                if (err instanceof DOMException && err.name === 'AbortError') {
                    message = 'Extraction timed out. This document is too large or complex for immediate processing. Please try a smaller file or splitting it.';
                }

                setUploadErrors(prev => [...prev, {
                    filename: file.name,
                    reason: message
                }]);
            }
            // Increment progress counter
            setProcessedCount(prev => prev + 1);
        }

        setResults(prev => [...prev, ...newResults]);
        setFiles([]); // Clear queue after processing
        setIsUploading(false);

        // Show completion toast with dashboard link
        if (newResults.length > 0) {
            showToast(
                `✅ ${newResults.length} document${newResults.length > 1 ? 's' : ''} processed! View in Dashboard →`,
                'success',
                6000
            );
        }
    };

    const handlePreview = (file: File) => {
        let previewFile = file;
        
        // If the file is missing a specific MIME type (common when extracted from ZIPs)
        if (!file.type || file.type === 'application/octet-stream' || file.type === '') {
            const ext = file.name.split('.').pop()?.toLowerCase();
            let mimeType = 'application/octet-stream';
            
            if (ext === 'pdf') mimeType = 'application/pdf';
            else if (['jpg', 'jpeg'].includes(ext || '')) mimeType = 'image/jpeg';
            else if (ext === 'png') mimeType = 'image/png';
            
            if (mimeType !== 'application/octet-stream') {
                previewFile = new window.File([file], file.name, { type: mimeType });
            }
        }
        
        const url = URL.createObjectURL(previewFile);
        window.open(url, '_blank');
    };

    const handleEditToggle = (id: string) => {
        setResults(results.map(r => r.id === id ? { ...r, isEditing: !r.isEditing } : r));
    };

    const handleDataChange = (id: string, field: keyof ExtractedData, value: string) => {
        setResults(results.map(r => r.id === id ? { ...r, data: { ...r.data, [field]: value } } : r));
    };

    const generateDefaultTitle = () => {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `Transmittal ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}${pad(now.getMinutes())}`;
    };

    const handleExportExcel = async () => {
        try {
            const mappedDocs: DocumentExportData[] = results.map(r => ({
                documentNumber: r.data.documentNumber || '',
                revision: r.data.revision || '',
                documentType: r.filename.split('.').pop()?.toUpperCase() || '',
                title: r.data.title || r.filename,
                issueDate: r.data.issueDate || '',
                discipline: r.data.discipline || 'General',
                consultant: r.data.consultant || '',
                status: r.data.status || 'Pending',
                summary: r.data.summary || ''
            }));

            const finalFilename = await exportToExcel(
                mappedDocs,
                transmittalTitle || generateDefaultTitle(),
                companySettings.logo,
                companySettings.name,
                uploadErrors
            );

            showToast(
                `✅ Exported ${results.length} documents to ${finalFilename}`,
                'success',
                5000
            );
        } catch (error) {
            console.error('Excel export error:', error);
            showToast('Failed to export Excel. Please try again or contact support.', 'error', 7000);
        }
    };



    const handleExportPDF = async () => {
        try {
            const mappedDocs: DocumentExportData[] = results.map(r => ({
                documentNumber: r.data.documentNumber || '',
                revision: r.data.revision || '',
                documentType: r.filename.split('.').pop()?.toUpperCase() || '',
                title: r.data.title || r.filename,
                issueDate: r.data.issueDate || '',
                discipline: r.data.discipline || 'General',
                consultant: r.data.consultant || '',
                status: r.data.status || 'Pending',
                summary: r.data.summary || ''
            }));

            const finalFilename = await exportToPDF(
                mappedDocs,
                transmittalTitle || generateDefaultTitle(),
                companySettings.logo,
                companySettings.name
            );

            showToast(
                `✅ Exported ${results.length} documents to ${finalFilename}`,
                'success',
                5000
            );
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('Failed to export PDF. Please try again or contact support.', 'error', 7000);
        }
    };



    const handleStartOver = () => {
        showModal(
            'Clear Results',
            'Are you sure you want to clear all current results? This cannot be undone.',
            'danger',
            () => {
                setResults([]);
                setFiles([]);
                setError(null);
            },
            'Yes, Clear All'
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <SEO title="Upload Documents | Transmit.AI" />
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                confirmText={modalConfig.confirmText}
            />
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Upload Documents</h1>
                <p className="text-slate-500 mt-2">
                    Intelligent metadata extraction for Engineering, Construction, and Technical Documentation.
                </p>

                {/* Upload Guidance */}
                <div className="mt-6 bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col md:flex-row gap-6 text-sm">
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <FileCheck size={16} className="text-blue-600" /> Supported Formats
                        </h4>
                        <p className="text-slate-600 leading-relaxed">
                            We support <span className="font-medium text-slate-800">PDF, Word (DOCX), Excel (XLSX), Images (JPG, PNG), CAD files (DXF), Text (TXT), and CSV.</span>
                        </p>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" /> Pro Tips
                        </h4>
                        <ul className="text-slate-600 space-y-1 list-disc list-inside">
                            <li>Set a Transmittal Title to organise easier</li>
                            <li>Review extracted data before exporting</li>
                        </ul>
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 hidden md:block"></div>
                        <div className="md:pl-6">
                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-green-600" /> Secure & Private
                            </h4>
                            <p className="text-slate-600">
                                Your documents are encrypted and only accessible by you.
                                We never share your data with third parties.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out cursor-pointer group
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                        : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 bg-white'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
            >
                <input
                    type="file"
                    id="fileInput"
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,.dxf,.zip"
                />

                {isProcessingUploads ? (
                    <div className="py-2">
                        <div className="w-16 h-16 text-blue-600 mx-auto mb-4 flex items-center justify-center relative">
                            <LoadingSpinner size="large" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">Extracting Files...</h3>
                        <p className="text-slate-500 mt-2 mb-6">Scanning directories and unpacking archives</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">Drop files, folders, or ZIPs here</h3>
                        <p className="text-slate-500 mt-2 mb-2">or click to browse from your computer</p>
                        <p className="text-sm font-medium text-amber-600 mb-6 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-100">Maximum file size: 4.5MB</p>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">PDF • DOCX • XLSX • TXT • CSV • DXF • ZIP / Folders</p>
                    </>
                )}
            </div>

            {/* Error Message (Global / Limit) */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
                    <AlertCircle size={20} />
                    <div className="flex-grow">
                        <p>{error}</p>
                        {(error.includes('limit') || error.includes('Plan')) && (
                            <button
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className="text-sm font-bold underline mt-1 hover:text-red-800"
                            >
                                Upgrade to Pro to process more documents.
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Batch Upload Errors - Persistent List */}
            {uploadErrors.length > 0 && (
                <div className="w-full bg-red-50 border border-red-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="px-5 py-4 bg-red-100/50 border-b border-red-200 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-red-800">
                            <div className="bg-red-200/50 p-1.5 rounded-full">
                                <AlertCircle size={20} className="text-red-700" />
                            </div>
                            <div>
                                <h4 className="font-bold text-red-900">{uploadErrors.length} File{uploadErrors.length > 1 ? 's' : ''} Encountered Issues</h4>
                                <p className="text-xs text-red-700/80 mt-0.5">These files could not be processed and were not deducted from your limits.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setUploadErrors([])}
                            className="text-xs font-semibold text-red-700 hover:text-red-900 px-3 py-1.5 rounded-md hover:bg-red-200/50 transition-colors"
                        >
                            Dismiss All
                        </button>
                    </div>
                    <ul className="divide-y divide-red-100 bg-white">
                        {uploadErrors.map((err, idx) => {
                            const isUpgradeError = err.reason.includes('Please upgrade to Pro');
                            const baseMessage = isUpgradeError ? err.reason.split('Please upgrade')[0] : err.reason;

                            const guessDocumentType = (filename: string): string => {
                                const lower = filename.toLowerCase();
                                if (lower.includes('spec') || lower.includes('specification')) return 'Specification';
                                if (lower.includes('report') || lower.includes('survey')) return 'Report / Survey';
                                if (lower.includes('schedule') || lower.includes('sow')) return 'Schedule / Scope of Work';
                                if (lower.match(/(ga|plan|section|elevation|detail|layout|drg|drawing)/)) return 'Drawing';
                                if (lower.includes('price') || lower.includes('quote') || lower.includes('cost')) return 'Pricing Document';
                                if (lower.includes('prelim') || lower.includes('header')) return 'Preliminaries / Cover';
                                return 'Unknown Document Type';
                            };

                            // Transform technical errors to user-friendly messages
                            let friendlyMessage = baseMessage;
                            let suggestedType = '';

                            if (friendlyMessage.includes('Cannot find package') || friendlyMessage.includes('Cannot find module') || friendlyMessage.includes('internal/modules') || friendlyMessage.includes('DOMMatrix')) {
                                friendlyMessage = 'System dependencies missing for scanned documents. Please provide a standard digital PDF.';
                            } else if (friendlyMessage.includes('corrupt') || friendlyMessage.includes('unreadable')) {
                                friendlyMessage = 'Document is corrupt, password-protected, or completely unreadable.';
                            } else if (friendlyMessage.includes('Failed to read PDF')) {
                                friendlyMessage = 'Failed to read PDF format. The file might be corrupted or locked.';
                            } else if (friendlyMessage.includes('empty')) {
                                friendlyMessage = 'The document appears to be empty and contains no readable text.';
                            } else if (friendlyMessage.includes('complexity') || friendlyMessage.includes('large visual complexity') || friendlyMessage.includes('too complex') || friendlyMessage.includes('exceedingly complex')) {
                                friendlyMessage = 'This document could not be automatically analysed due to its exceedingly large visual complexity.';
                                suggestedType = guessDocumentType(err.filename);
                            } else if (friendlyMessage.includes('500') || friendlyMessage.includes('Server error')) {
                                friendlyMessage = 'Internal system error occurred during extraction. Our engineers have been alerted.';
                            }

                            return (
                                <li key={idx} className="flex gap-4 p-4 items-start">
                                    <span className="font-semibold text-slate-800 break-all w-1/3 truncate" title={err.filename}>{err.filename}</span>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <span className="text-red-700 text-sm text-balance">
                                            {friendlyMessage}
                                            {isUpgradeError && (
                                                <button
                                                    onClick={() => setIsUpgradeModalOpen(true)}
                                                    className="font-bold underline hover:text-red-900 transition-colors ml-1"
                                                >
                                                    Please upgrade to Pro.
                                                </button>
                                            )}
                                        </span>
                                        {suggestedType && (
                                            <span className="text-xs text-slate-500 font-medium">
                                                Based on filename, this appears to be a <span className="font-bold text-slate-700">{suggestedType}</span>. You can manually enter this document's details from your Excel export.
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Transmittal Title Input - Moved here so it can be set BEFORE upload */}
            {files.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                    <label htmlFor="transmittalTitle" className="block text-sm font-semibold text-blue-900 mb-1">
                        Transmittal Title / Package Name (Optional)
                    </label>
                    <input
                        type="text"
                        id="transmittalTitle"
                        placeholder="e.g., P01_Structural_Package_A"
                        className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-blue-300/70 text-blue-900 font-medium"
                        value={transmittalTitle}
                        onChange={(e) => setTransmittalTitle(e.target.value)}
                    />
                    <p className="text-xs text-blue-600/80 mt-1.5 pl-1">
                        Enter a title here to group these documents together in your dashboard.
                    </p>
                </div>
            )}

            {/* Queue */}
            {files.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700">Ready to Process ({files.length})</h3>
                        <button className="text-sm text-red-500 hover:text-red-700 font-medium" onClick={() => setFiles([])}>Clear All</button>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {files.map((file, idx) => (
                            <div key={idx} className="px-6 py-4 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        {(() => {
                                            const ext = file.name.split('.').pop()?.toLowerCase() || '';
                                            if (['pdf'].includes(ext)) return <FileText size={24} className="text-red-500" />;
                                            if (['doc', 'docx'].includes(ext)) return <FileText size={24} className="text-blue-600" />;
                                            if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={24} className="text-green-600" />;
                                            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage size={24} className="text-purple-600" />;
                                            if (['dwg', 'dxf'].includes(ext)) return <FileCode size={24} className="text-amber-600" />;
                                            return <File size={24} className="text-slate-400" />;
                                        })()}
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-medium">{file.name}</p>
                                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                                    className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {isUploading ? (
                        <div className="p-10 bg-slate-900 border-t border-slate-800 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                                <div className="relative bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full p-5 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                                    <Layers size={36} className="text-white animate-pulse" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Analysing {processedCount} of {files.length} Document{files.length !== 1 ? 's' : ''}...</h3>
                            <p className="text-blue-400 font-medium tracking-widest uppercase text-sm animate-pulse">
                                Extracting metadata via AI
                            </p>
                            <div className="w-full max-w-sm mt-6">
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.max(5, (processedCount / files.length) * 100)}%` }}></div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mt-6 max-w-md text-center">
                                This process takes roughly 3-5 seconds per document. <br />
                                <span className="text-amber-400 font-medium">Please do not close or refresh this page.</span>
                            </p>
                            <style>{`
                                @keyframes progress {
                                    0% { width: 0%; transform: translateX(-100%); }
                                    50% { width: 40%; }
                                    100% { width: 100%; transform: translateX(100%); }
                                }
                            `}</style>
                        </div>
                    ) : (
                        <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={processFiles}
                                className="btn-primary flex items-center gap-2 px-8 py-3 text-lg font-semibold rounded-xl active:scale-95 transition-all hover:shadow-lg shadow-blue-600/20"
                            >
                                <span>Start AI Extraction</span>
                                <CheckCircle size={22} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-6">


                    <div className="flex flex-wrap justify-between items-start gap-2">
                        <h2 className="text-2xl font-bold text-slate-900">Extraction Results ({results.length})</h2>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={handleStartOver} className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium">
                                <RotateCcw size={16} /> Start Over
                            </button>
                            <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                                <File size={16} /> Export Excel
                            </button>
                            <button type="button" onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                                <Download size={16} /> Export PDF
                            </button>
                            <div className="w-px h-8 bg-slate-200 mx-1"></div>
                            <Link to="/app" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 text-sm font-semibold active:scale-95">
                                Return to Dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {results.map((result) => (
                            <div key={result.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                                <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50 border-slate-200 rounded-t-xl">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                                            {(() => {
                                                const ext = result.filename.split('.').pop()?.toLowerCase() || '';
                                                if (['pdf'].includes(ext)) return <FileText size={14} className="text-red-500" />;
                                                if (['doc', 'docx'].includes(ext)) return <FileText size={14} className="text-blue-600" />;
                                                if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={14} className="text-green-600" />;
                                                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage size={14} className="text-purple-600" />;
                                                if (['dwg', 'dxf'].includes(ext)) return <FileCode size={14} className="text-amber-600" />;
                                                return <File size={14} className="text-blue-500" />;
                                            })()}
                                            {result.filename}
                                        </h3>
                                        <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">AI</span>
                                        {result.isDuplicate && (
                                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 ml-1 group relative cursor-help">
                                                <AlertCircle size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Potential Duplicate</span>
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-[250px] p-2 bg-slate-900 text-white text-xs rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                                                    <p className="font-semibold mb-0.5 text-amber-400">Exact Match Found</p>
                                                    <p className="text-slate-300 leading-snug">The AI extracted the identical Document Number and Revision as: <br /><strong className="text-white mt-1 inline-block truncate max-w-full">{result.duplicateOf}</strong></p>
                                                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-[5px] border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        )}
                                        {result.data.confidence_score !== undefined && (
                                            <div className="group relative flex items-center z-10">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 cursor-help border
                                                    ${result.data.confidence_score >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
                                                        result.data.confidence_score >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-red-50 text-red-700 border-red-200'}`}
                                                >
                                                    {result.data.confidence_score >= 90 ? <ShieldCheck size={12} /> :
                                                        result.data.confidence_score >= 70 ? <AlertCircle size={12} /> :
                                                            <AlertCircle size={12} />}
                                                    {result.data.confidence_score}%
                                                </span>
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl pointer-events-none">
                                                    <div className="font-semibold text-slate-200 mb-1 flex items-center justify-between">
                                                        <span>Data Quality</span>
                                                        <span className={
                                                            result.data.confidence_score >= 90 ? 'text-green-400' :
                                                                result.data.confidence_score >= 70 ? 'text-amber-400' : 'text-red-400'
                                                        }>{result.data.confidence_score}%</span>
                                                    </div>
                                                    <p className="text-slate-300 leading-relaxed font-medium">
                                                        {result.data.reasoning_notes || 'All key data points successfully captured with high confidence.'}
                                                    </p>
                                                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handlePreview(result.file)}
                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                                            title="Preview File"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleEditToggle(result.id)}
                                            className={`p-1.5 rounded transition-colors ${result.isEditing ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
                                            title={result.isEditing ? "Save Changes" : "Edit Metadata"}
                                        >
                                            {result.isEditing ? <Save size={16} /> : <Edit2 size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white">
                                    {/* Row 1: Type | Doc Num | Rev | Date */}
                                    <div className="col-span-1 sm:border-r border-slate-100 pr-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Type</p>
                                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200">
                                            {result.filename.split('.').pop()}
                                        </span>
                                    </div>
                                    <div className="col-span-1 sm:border-r border-slate-100 px-0 sm:px-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Document Number</p>
                                        {result.isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full px-1 py-0.5 border rounded text-xs text-slate-900 border-slate-300 focus:border-blue-500 outline-none"
                                                value={result.data.documentNumber || ''}
                                                onChange={(e) => handleDataChange(result.id, 'documentNumber', e.target.value)}
                                            />
                                        ) : (
                                            <p className="font-bold text-sm text-slate-900 truncate" title={result.data.documentNumber || '-'}>
                                                {result.data.documentNumber || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-1 group sm:border-r border-slate-100 px-0 sm:px-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Revision</p>
                                        {result.isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full px-1 py-0.5 border rounded text-xs text-slate-900 border-slate-300 focus:border-blue-500 outline-none"
                                                value={result.data.revision || ''}
                                                onChange={(e) => handleDataChange(result.id, 'revision', e.target.value)}
                                            />
                                        ) : (
                                            <p className="font-bold text-sm text-slate-900 truncate" title={result.data.revision || '-'}>
                                                {result.data.revision || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-1 pl-0 sm:pl-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Date</p>
                                        {result.isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full px-1 py-0.5 border rounded text-xs text-slate-900 border-slate-300 focus:border-blue-500 outline-none"
                                                value={result.data.issueDate || ''}
                                                onChange={(e) => handleDataChange(result.id, 'issueDate', e.target.value)}
                                            />
                                        ) : (
                                            <p className="font-medium text-sm text-slate-900 truncate" title={result.data.issueDate || '-'}>
                                                {result.data.issueDate || '-'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Row 2: Discipline | Consultant | Title (Span 2) */}
                                    <div className="col-span-1 sm:border-r border-slate-100 pr-2 mt-2 sm:mt-0">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Discipline</p>
                                        {result.isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full px-1 py-0.5 border rounded text-xs text-slate-900 border-slate-300 focus:border-blue-500 outline-none"
                                                value={result.data.discipline || ''}
                                                onChange={(e) => handleDataChange(result.id, 'discipline', e.target.value)}
                                            />
                                        ) : (
                                            <p className="font-medium text-sm text-slate-900 truncate" title={result.data.discipline || '-'}>
                                                {result.data.discipline || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-1 sm:border-r border-slate-100 px-0 sm:px-2 mt-2 sm:mt-0">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Consultant</p>
                                        {result.isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full px-1 py-0.5 border rounded text-xs text-slate-900 border-slate-300 focus:border-blue-500 outline-none"
                                                value={result.data.consultant || ''}
                                                onChange={(e) => handleDataChange(result.id, 'consultant', e.target.value)}
                                            />
                                        ) : (
                                            <p className="font-medium text-sm text-slate-900 truncate" title={result.data.consultant || '-'}>
                                                {result.data.consultant || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-full lg:col-span-2 pl-0 sm:pl-2 mt-2 sm:mt-0">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Title</p>
                                        {result.isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full px-1 py-0.5 border rounded text-xs text-slate-900 border-slate-300 focus:border-blue-500 outline-none"
                                                value={result.data.title || ''}
                                                onChange={(e) => handleDataChange(result.id, 'title', e.target.value)}
                                            />
                                        ) : (
                                            <p className="font-medium text-sm text-slate-900 truncate" title={result.data.title || '-'}>
                                                {result.data.title || '-'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Row 3: Summary (Span 3) | Button (Span 1) */}
                                    <div className="col-span-3 pr-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">AI Summary</p>
                                        <p className="text-xs text-slate-600 italic line-clamp-1" title={result.data.summary}>
                                            {result.data.summary || 'No summary available.'}
                                        </p>
                                    </div>
                                    <div className="col-span-1 flex items-end justify-end pl-2">
                                        {/* Register feature removed per user request */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadPage;
