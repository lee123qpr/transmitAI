import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Upload, X, File, FileText, FileSpreadsheet, FileImage, FileCode, CheckCircle, AlertCircle, Eye, Download, Edit2, Save, RotateCcw, FileCheck, ShieldCheck, Zap } from 'lucide-react';
import { useDocumentStore } from '../services/store';
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
    summary?: string;
    documentType?: string;
    status?: string;
}

interface ResultItem {
    id: string;
    filename: string;
    data: ExtractedData;
    file: File;
    isEditing: boolean;
}

const UploadPage = () => {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToast();
    // Global sync in App.tsx handles the initial fetch now.
    // We only need to worry about local state here.

    // ... rest of state ...
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
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
                const url = email ? `/api/user?email=${encodeURIComponent(email)}` : `/api/user`;
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

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            setFiles(prev => [...prev, ...newFiles]);
            setError(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
            setError(null);
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
                const response = await fetch('/api/documents/upload', {
                    method: 'POST',
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: formData,
                });

                if (!response.ok) {
                    let errorData: any = {};
                    const text = await response.text();
                    try {
                        errorData = JSON.parse(text);
                    } catch (e) {
                        console.error('[Upload] Non-JSON error response:', text.substring(0, 100));
                        errorData = { error: `Server error (${response.status}). The service might be timing out or unavailable.` };
                    }

                    // Handle Specific Error Cases
                    if (response.status === 400) {
                        showToast(`Analysis failed: ${file.name}`, 'error');
                        const msg = errorData.message || 'The AI could not read this document format.';
                        setUploadErrors(prev => [...prev, { filename: file.name, reason: msg }]);
                        throw new Error(msg);
                    }

                    const msg = errorData.error || `Server error during processing.`;
                    setUploadErrors(prev => [...prev, { filename: file.name, reason: msg }]);
                    throw new Error(msg);
                }

                const json = await response.json();

                // Update Usage Store
                if (json.usage) {
                    setUsage(json.usage.current, json.usage.limit);
                }

                newResults.push({
                    id: Math.random().toString(36).substr(2, 9),
                    filename: file.name,
                    data: json.data,
                    file: file,
                    isEditing: false
                });
            } catch (err: any) {
                console.error('Upload failed:', err);

                // Only add generic error if it wasn't already added manually in the !response.ok block
                const isKnownError = err.message?.includes('AI could not read') ||
                    err.message?.includes('Server error during processing') ||
                    err.message?.includes('Server error (');

                if (!isKnownError) {
                    setUploadErrors(prev => [...prev, {
                        filename: file.name,
                        reason: err.message || 'Connection lost or server timeout.'
                    }]);
                }
            }
        }

        setResults(prev => [...prev, ...newResults]);
        setFiles([]); // Clear queue after processing
        setIsUploading(false);
    };

    const handlePreview = (file: File) => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    };

    const handleEditToggle = (id: string) => {
        setResults(results.map(r => r.id === id ? { ...r, isEditing: !r.isEditing } : r));
    };

    const handleDataChange = (id: string, field: keyof ExtractedData, value: string) => {
        setResults(results.map(r => r.id === id ? { ...r, data: { ...r.data, [field]: value } } : r));
    };

    const handleExportExcel = async () => {
        try {
            // Dynamically import ExcelJS only when needed
            const ExcelJS = (await import('exceljs')).default;

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Extracted Data');

            // Add Transmittal Title if exists
            let currentRow = 1;

            // Add Company Logo/Name if present
            if (companySettings.name || companySettings.logo) {
                // If we have a logo, we can add it (ExcelJS supports images)
                // For MVP, just putting Company Name in big text at A1
                if (companySettings.name) {
                    worksheet.mergeCells('A1:B1');
                    const cell = worksheet.getCell('A1');
                    cell.value = companySettings.name;
                    cell.font = { bold: true, size: 16, color: { argb: 'FF2563EB' } }; // Blue color
                    currentRow += 2;
                }
            }

            if (transmittalTitle) {
                worksheet.getRow(currentRow).values = [transmittalTitle];
                worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
                worksheet.mergeCells(`A${currentRow}:I${currentRow}`); // Merge across 9 columns
                currentRow += 2; // Leave a blank row
            }

            worksheet.getRow(currentRow).values = ['Filename', 'Type', 'Document Number', 'Revision', 'Title', 'Issue Date', 'Discipline', 'Consultant', 'Summary'];
            worksheet.getRow(currentRow).font = { bold: true };

            // Define Columns (for width only)
            worksheet.columns = [
                { key: 'filename', width: 30 },
                { key: 'type', width: 10 },
                { key: 'documentNumber', width: 20 },
                { key: 'revision', width: 10 },
                { key: 'title', width: 40 },
                { key: 'issueDate', width: 15 },
                { key: 'discipline', width: 15 },
                { key: 'consultant', width: 20 },
                { key: 'summary', width: 50 },
            ];

            results.forEach(r => {
                worksheet.addRow([
                    r.filename,
                    r.filename.split('.').pop()?.toUpperCase() || '',
                    r.data.documentNumber || '',
                    r.data.revision || '',
                    r.data.title || '',
                    r.data.issueDate || '',
                    r.data.discipline || '',
                    r.data.consultant || '',
                    r.data.summary || ''
                ]);
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Use transmittal title for filename if available
            a.download = transmittalTitle ? `${transmittalTitle.replace(/[^a-z0-9]/gi, '_')}.xlsx` : 'extracted_data.xlsx';
            a.click();
            URL.revokeObjectURL(url);

            showToast(
                `✅ Exported ${results.length} documents to ${transmittalTitle ? `${transmittalTitle.replace(/[^a-z0-9]/gi, '_')}.xlsx` : 'extracted_data.xlsx'}`,
                'success',
                5000
            );
        } catch {
            showToast('Excel export failed', 'error');
        }
    };



    const handleExportPDF = async () => {
        try {
            // Dynamically import jsPDF and autoTable only when needed
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();
            let yPos = 15;

            // Add Transmittal Title
            // Add Header with Company Info
            if (companySettings.logo) {
                try {
                    doc.addImage(companySettings.logo, 'PNG', 160, 10, 30, 15); // Top Right Logo
                } catch (e) {
                    console.warn('Failed to add logo to PDF', e);
                }
            }

            if (companySettings.name) {
                doc.setFontSize(20);
                doc.setTextColor(37, 99, 235); // Blue
                doc.text(companySettings.name, 14, 20);
                doc.setTextColor(0, 0, 0); // Reset
                yPos = 35;
            }

            // Add Transmittal Title
            if (transmittalTitle) {
                doc.setFontSize(14);
                doc.text(transmittalTitle, 14, yPos);
                yPos += 10;
                doc.setFontSize(10); // Reset for table
            }

            const tableBody = results.map(r => [
                r.filename,
                r.filename.split('.').pop()?.toUpperCase() || '',
                r.data.documentNumber || '',
                r.data.revision || '',
                r.data.title || '',
                r.data.issueDate || '',
                r.data.discipline || '',
                r.data.consultant || ''
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Filename', 'Type', 'Doc Num', 'Rev', 'Title', 'Date', 'Disc', 'Cons']],
                body: tableBody,
            });

            const filename = transmittalTitle ? `${transmittalTitle.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'extracted_data.pdf';
            doc.save(filename);

            showToast(
                `✅ Exported ${results.length} documents to ${filename}`,
                'success',
                5000
            );
        } catch {
            console.error('PDF export error: Failed to export PDF.');
            showToast(
                'Failed to export PDF. Please try again or contact support.',
                'error',
                7000
            );
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
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,.dxf"
                />
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Drag & Drop files here</h3>
                <p className="text-slate-500 mt-2 mb-6">or click to browse from your computer</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">PDF • DOCX • XLSX • TXT • CSV • DXF • Images</p>
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
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                            <AlertCircle size={18} />
                            {uploadErrors.length} File{uploadErrors.length > 1 ? 's' : ''} failed to process
                        </h4>
                        <button
                            onClick={() => setUploadErrors([])}
                            className="text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1 rounded hover:bg-amber-100 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                    <ul className="space-y-2 text-sm">
                        {uploadErrors.map((err, idx) => (
                            <li key={idx} className="flex gap-2 text-amber-700 bg-white/50 p-2 rounded border border-amber-100/50">
                                <span className="font-medium text-slate-700 break-all min-w-[30%]">{err.filename}:</span>
                                <span className="flex-1">{err.reason}</span>
                            </li>
                        ))}
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
                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <div className="flex justify-end">
                            <button
                                onClick={processFiles}
                                disabled={isUploading}
                                className={`btn-primary flex items-center gap-2 px-6 py-2.5 rounded-lg active:scale-95 transition-all
                                    ${isUploading ? 'opacity-80 cursor-wait' : 'hover:shadow-md'}`}
                            >
                                {isUploading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span>Processing {files.length} files...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Start AI Extraction</span>
                                        <CheckCircle size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                        {isUploading && (
                            <p className="text-xs text-amber-700 mt-3 text-center bg-amber-50 py-2 px-4 rounded-lg border border-amber-200">
                                ⏱️ This may take a moment. Please don't refresh or close this page.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-6">


                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-900">Extraction Results ({results.length})</h2>
                        <div className="flex gap-2">
                            <button onClick={handleStartOver} className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium">
                                <RotateCcw size={16} /> Start Over
                            </button>
                            <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                                <File size={16} /> Export Excel
                            </button>
                            <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                                <Download size={16} /> Export PDF
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {results.map((result) => (
                            <div key={result.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all">
                                <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50 border-slate-200">
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
                                <div className="p-3 grid grid-cols-4 gap-3 bg-white">
                                    {/* Row 1: Type | Doc Num | Rev | Date */}
                                    <div className="col-span-1 border-r border-slate-100 pr-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Type</p>
                                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase border border-slate-200">
                                            {result.filename.split('.').pop()}
                                        </span>
                                    </div>
                                    <div className="col-span-1 border-r border-slate-100 px-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Document Number</p>
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
                                    <div className="col-span-1 border-r border-slate-100 px-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Revision</p>
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
                                    <div className="col-span-1 pl-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Date</p>
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
                                    <div className="col-span-1 border-r border-slate-100 pr-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Discipline</p>
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
                                    <div className="col-span-1 border-r border-slate-100 px-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Consultant</p>
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
                                    <div className="col-span-2 pl-2">
                                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Title</p>
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
