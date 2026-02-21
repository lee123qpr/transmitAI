import { useState, useEffect, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useDocumentStore, type DocumentData } from '../services/store';
// Lazy load heavy dependencies to reduce initial bundle size
// import ExcelJS from 'exceljs';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
import UpgradeModal from '../components/UpgradeModal';
import Modal from '../components/Modal';
import { Zap, Folder, Calendar, ChevronRight, ArrowLeft, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import WelcomeModal from '../components/WelcomeModal';

import SEO from '../components/SEO';

const Dashboard = () => {
    const { user } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const {
        documents, usage, subscriptionTier, isAdmin,
        fetchDocuments, deleteDocument, deleteTransmittal,
        isLoading, isInitialized
    } = useDocumentStore();
    const { showToast } = useToast();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [selectedTransmittal, setSelectedTransmittal] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });



    useEffect(() => {
        const sync = async () => {
            if (user?.id) {
                const token = await getToken();
                // Ensure we have the latest tier/usage before showing the dashboard
                await fetchUserStatus(user.id, user.primaryEmailAddress?.emailAddress, token || undefined);
                await fetchDocuments(user.id, token || undefined);
            }
        };
        sync();
    }, [user?.id, getToken, fetchUserStatus, fetchDocuments]);

    const isPro = subscriptionTier === 'pro' || subscriptionTier === 'business' || isAdmin;
    const documentLimit = usage.limit;
    const documentsUsed = usage.current;

    // Group Documents by Transmittal Title and sort by Discipline
    const transmittals = useMemo(() => {
        const groups: Record<string, DocumentData[]> = {};

        // Define discipline order for consistent sorting
        const disciplineOrder: Record<string, number> = {
            'Architectural': 1,
            'Structural': 2,
            'Civil': 3,
            'Mechanical': 4,
            'Electrical': 5,
            'Plumbing': 6,
            'MEP': 7,
            'Landscape': 8,
            'General': 9
        };

        documents.forEach(doc => {
            const title = doc.transmittalTitle || 'Unsorted Uploads';
            if (!groups[title]) groups[title] = [];
            groups[title].push(doc);
        });

        // Sort documents within each transmittal by discipline, then by document number
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                const disciplineA = a.discipline || 'General';
                const disciplineB = b.discipline || 'General';
                const orderA = disciplineOrder[disciplineA] || 999;
                const orderB = disciplineOrder[disciplineB] || 999;

                // First sort by discipline
                if (orderA !== orderB) {
                    return orderA - orderB;
                }

                // Then sort by document number
                return (a.documentNumber || '').localeCompare(b.documentNumber || '');
            });
        });

        return groups;
    }, [documents]);

    const handleExport = async (docsToExport: DocumentData[], filename: string) => {
        if (!isPro) {
            setIsUpgradeModalOpen(true);
            return;
        }

        setIsExporting(true);
        try {
            // Dynamically import ExcelJS only when needed
            const ExcelJS = (await import('exceljs')).default;

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Transmittal Register');

            // Add Title Row
            worksheet.mergeCells('A1:G1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = selectedTransmittal || 'Transmittal Register';
            titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F2937' } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            worksheet.getRow(1).height = 30;

            // Add Date Row
            worksheet.mergeCells('A2:G2');
            const dateCell = worksheet.getCell('A2');
            dateCell.value = `Exported: ${new Date().toLocaleDateString('en-GB')}`;
            dateCell.font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
            dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(2).height = 20;

            // Define columns (starting at row 4)
            worksheet.columns = [
                { header: 'Doc Number', key: 'documentNumber', width: 22 },
                { header: 'Revision', key: 'revision', width: 12 },
                { header: 'Type', key: 'documentType', width: 15 },
                { header: 'Title', key: 'title', width: 45 },
                { header: 'Status', key: 'status', width: 18 },
                { header: 'Issue Date', key: 'issueDate', width: 15 },
                { header: 'Discipline', key: 'discipline', width: 18 },
                { header: 'Consultant', key: 'consultant', width: 25 },
                { header: 'Summary', key: 'summary', width: 50 },
            ];

            // Style header row (row 4)
            worksheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            worksheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
            worksheet.getRow(4).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(4).height = 25;
            worksheet.getRow(4).border = {
                bottom: { style: 'thick', color: { argb: 'FF374151' } }
            };

            // Sort documents by discipline
            const disciplineOrder: Record<string, number> = {
                'Architectural': 1, 'Structural': 2, 'Civil': 3, 'Mechanical': 4,
                'Electrical': 5, 'Plumbing': 6, 'MEP': 7, 'Landscape': 8, 'General': 9
            };

            const sortedDocs = [...docsToExport].sort((a, b) => {
                const disciplineA = a.discipline || 'General';
                const disciplineB = b.discipline || 'General';
                const orderA = disciplineOrder[disciplineA] || 999;
                const orderB = disciplineOrder[disciplineB] || 999;

                if (orderA !== orderB) return orderA - orderB;
                return (a.documentNumber || '').localeCompare(b.documentNumber || '');
            });

            // Group by discipline colors
            let currentRow = 5;
            const disciplineColors: Record<string, string> = {
                'Architectural': 'FFF3E8FF', 'Structural': 'FFDBEAFE', 'Civil': 'FFFEF3C7',
                'Mechanical': 'FFBFDBFE', 'Electrical': 'FFFEF9C3', 'Plumbing': 'FFD1FAE5',
                'MEP': 'FFE0E7FF', 'Landscape': 'FFD1FAE5', 'General': 'FFF3F4F6'
            };

            // Add documents with discipline grouping
            let currentDiscipline = '';
            sortedDocs.forEach((doc) => {
                const discipline = doc.discipline || 'General';

                // Add discipline header if discipline changes
                if (discipline !== currentDiscipline) {
                    currentDiscipline = discipline;
                    const disciplineRow = worksheet.getRow(currentRow);
                    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
                    const disciplineCell = worksheet.getCell(`A${currentRow}`);
                    disciplineCell.value = `━━━ ${discipline.toUpperCase()} ━━━`;
                    disciplineCell.font = { bold: true, size: 11, color: { argb: 'FF374151' } };
                    disciplineCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
                    disciplineCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: disciplineColors[discipline] || 'FFF3F4F6' } };
                    disciplineRow.height = 22;
                    currentRow++;
                }

                // Add document row
                worksheet.addRow(doc);
                const row = worksheet.getRow(currentRow);

                // Zebra striping within discipline
                const isEven = (currentRow % 2 === 0);
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFFAFAFA' }
                };

                row.alignment = { vertical: 'middle' };
                row.height = 20;
                currentRow++;
            });

            // Add borders to all data cells
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber >= 4) {
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                        };
                    });
                }
            });

            // Freeze header rows
            worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${filename.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);

            showToast(
                `✅ Exported ${docsToExport.length} documents to ${filename}.xlsx`,
                'success',
                5000
            );
        } catch (error: unknown) {
            console.error('Export error:', error);
            let errorMessage = 'Failed to export Excel file. ';

            if (error instanceof Error) {
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    errorMessage += 'Network error - please check your connection and try again.';
                } else if (error.message.includes('memory')) {
                    errorMessage += 'File too large. Try exporting fewer documents at once.';
                } else {
                    errorMessage += 'Please try again or contact support if the issue persists.';
                }
            } else {
                errorMessage += 'Please try again.';
            }

            showToast(errorMessage, 'error', 7000);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async (docsToExport: DocumentData[], filename: string) => {
        if (!isPro) {
            setIsUpgradeModalOpen(true);
            return;
        }

        try {
            // Dynamically import jsPDF and autoTable only when needed
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            // Create landscape PDF for better column space
            const doc = new jsPDF({ orientation: 'landscape' });

            // Add Professional Header (landscape width = 297mm)
            doc.setFillColor(31, 41, 55); // Slate-800
            doc.rect(0, 0, 297, 35, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(selectedTransmittal || 'Transmittal Register', 105, 15, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Exported: ${new Date().toLocaleDateString('en-GB')}`, 105, 22, { align: 'center' });
            doc.text(`Total Documents: ${docsToExport.length}`, 105, 28, { align: 'center' });

            doc.setTextColor(0, 0, 0); // Reset to black
            let yPos = 42;

            // Sort documents by discipline
            const disciplineOrder: Record<string, number> = {
                'Architectural': 1, 'Structural': 2, 'Civil': 3, 'Mechanical': 4,
                'Electrical': 5, 'Plumbing': 6, 'MEP': 7, 'Landscape': 8, 'General': 9
            };

            const sortedDocs = [...docsToExport].sort((a, b) => {
                const disciplineA = a.discipline || 'General';
                const disciplineB = b.discipline || 'General';
                const orderA = disciplineOrder[disciplineA] || 999;
                const orderB = disciplineOrder[disciplineB] || 999;

                if (orderA !== orderB) return orderA - orderB;
                return (a.documentNumber || '').localeCompare(b.documentNumber || '');
            });

            // Group documents by discipline
            const disciplineGroups: Record<string, DocumentData[]> = {};
            sortedDocs.forEach(doc => {
                const discipline = doc.discipline || 'General';
                if (!disciplineGroups[discipline]) disciplineGroups[discipline] = [];
                disciplineGroups[discipline].push(doc);
            });

            // Discipline colors for section headers
            const disciplineColors: Record<string, [number, number, number]> = {
                'Architectural': [243, 232, 255], 'Structural': [219, 234, 254], 'Civil': [254, 243, 199],
                'Mechanical': [191, 219, 254], 'Electrical': [254, 249, 195], 'Plumbing': [209, 250, 229],
                'MEP': [224, 231, 255], 'Landscape': [209, 250, 229], 'General': [243, 244, 246]
            };

            // Create tables per discipline
            const orderedDisciplines = Object.keys(disciplineGroups).sort((a, b) => {
                const orderA = disciplineOrder[a] || 999;
                const orderB = disciplineOrder[b] || 999;
                return orderA - orderB;
            });
            orderedDisciplines.forEach((discipline) => {
                const disciplineDocs = disciplineGroups[discipline];
                const color = disciplineColors[discipline] || [243, 244, 246];

                // Add discipline section header
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFillColor(...color);
                doc.roundedRect(14, yPos, 269, 8, 1, 1, 'F');
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(55, 65, 81);
                doc.text(`${discipline.toUpperCase()}`, 16, yPos + 5.5);
                yPos += 10;

                doc.setTextColor(0, 0, 0);

                // Create table for this discipline
                const tableBody = disciplineDocs.map(d => [
                    d.documentNumber || '-',
                    d.revision || '-',
                    d.documentType || '-',
                    d.title || '-',
                    d.issueDate || '-',
                    d.status || '-',
                    d.consultant || '-',
                    d.summary || '-'
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Doc Number', 'Rev', 'Type', 'Title', 'Date', 'Status', 'Consultant', 'Summary']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [31, 41, 55],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 9,
                        halign: 'center'
                    },
                    bodyStyles: {
                        fontSize: 8,
                        cellPadding: 2
                    },
                    alternateRowStyles: {
                        fillColor: [250, 250, 250]
                    },
                    columnStyles: {
                        0: { cellWidth: 30 },   // Doc Number
                        1: { cellWidth: 12 },   // Rev
                        2: { cellWidth: 20 },   // Type
                        3: { cellWidth: 55 },   // Title
                        4: { cellWidth: 18 },   // Date
                        5: { cellWidth: 20 },   // Status
                        6: { cellWidth: 30 },   // Consultant
                        7: { cellWidth: 84 }    // Summary
                    },
                    margin: { left: 14, right: 14 },
                    didDrawPage: () => {
                        // Add page footer
                        const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
                        const pageHeight = doc.internal.pageSize.height;
                        doc.setFontSize(8);
                        doc.setTextColor(128, 128, 128);
                        doc.text(`Page ${(doc as unknown as { internal: { getCurrentPageInfo: () => { pageNumber: number } } }).internal.getCurrentPageInfo().pageNumber} of ${pageCount}`, 105, pageHeight - 10, { align: 'center' });
                    }
                });

                yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
            });

            const pdfFilename = `${filename.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            doc.save(pdfFilename);

            showToast(
                `✅ Exported ${docsToExport.length} documents to ${pdfFilename}`,
                'success',
                5000
            );
        } catch (error: unknown) {
            console.error('PDF Export error:', error);
            showToast(
                'Failed to export PDF. Please try again or contact support if the issue persists.',
                'error',
                7000
            );
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteTransmittal = (e: React.MouseEvent, title: string) => {
        e.stopPropagation();
        if (!user) return;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Transmittal?',
            message: `Are you sure you want to delete "${title}"? This will delete all ${transmittals[title].length} documents inside it.`,
            onConfirm: async () => {
                setIsDeleting(true);
                try {
                    const token = await getToken();
                    await deleteTransmittal(title, user.id, token || window.localStorage.getItem('clerk-db-jwt') || undefined);
                    if (selectedTransmittal === title) setSelectedTransmittal(null);
                    showToast(`Deleted transmittal "${title}"`, 'success');
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error('Delete error:', error);
                    showToast('Failed to delete transmittal', 'error');
                } finally {
                    setIsDeleting(false);
                }
            }
        });
    };

    const handleDeleteDocument = (e: React.MouseEvent, id: string, docNum: string) => {
        e.stopPropagation();
        if (!user) return;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Document?',
            message: `Are you sure you want to delete document "${docNum}"?`,
            onConfirm: async () => {
                setIsDeleting(true);
                try {
                    const token = await getToken();
                    await deleteDocument(id, user.id, token || window.localStorage.getItem('clerk-db-jwt') || undefined);
                    showToast(`Deleted document "${docNum}"`, 'success');
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error('Delete error:', error);
                    showToast('Failed to delete document', 'error');
                } finally {
                    setIsDeleting(false);
                }
            }
        });
    };

    const [isRenaming, setIsRenaming] = useState(false);
    const [newTransmittalName, setNewTransmittalName] = useState('');

    const handleRenameTransmittal = async () => {
        if (!selectedTransmittal || !newTransmittalName.trim() || newTransmittalName === selectedTransmittal) {
            setIsRenaming(false);
            return;
        }

        try {
            const token = await getToken();
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(`${API_URL}/transmittals/rename?userId=${user?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ oldTitle: selectedTransmittal, newTitle: newTransmittalName.trim() })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.count === 0) {
                    showToast('No documents were updated. Please refresh and try again.', 'error');
                } else {
                    // Optimistic update
                    fetchDocuments(user!.id); // Refetch to sync state
                    setSelectedTransmittal(newTransmittalName.trim());
                    showToast(`Renamed transmittal to "${newTransmittalName.trim()}"`, 'success');
                }
            } else {
                showToast(data.error || 'Failed to rename transmittal', 'error');
            }
        } catch (error) {
            console.error('Rename error:', error);
            showToast('Network error while renaming transmittal', 'error');
        } finally {
            setIsRenaming(false);
        }
    };

    return (
        <div className="space-y-6">
            <SEO title={selectedTransmittal ? `${selectedTransmittal} | Dashboard` : "Dashboard"} />
            <WelcomeModal />
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                message={confirmModal.message}
                type="danger"
                onConfirm={confirmModal.onConfirm}
                confirmText="Delete"
                isLoading={isDeleting}
            />

            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    {selectedTransmittal ? (
                        <div className="flex items-center gap-2 mb-1">
                            <button
                                onClick={() => setSelectedTransmittal(null)}
                                className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 text-sm font-medium"
                            >
                                <ArrowLeft size={16} /> Back to Transmittals
                            </button>
                        </div>
                    ) : (
                        <h1 className="text-3xl font-bold text-slate-900">Transmittal Register</h1>
                    )}

                    <div className="flex items-center gap-3">
                        {isRenaming && selectedTransmittal ? (
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="text"
                                    value={newTransmittalName}
                                    onChange={(e) => setNewTransmittalName(e.target.value)}
                                    className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none bg-transparent px-1 py-0.5 w-[400px]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameTransmittal();
                                        if (e.key === 'Escape') setIsRenaming(false);
                                    }}
                                />
                                <button
                                    onClick={handleRenameTransmittal}
                                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-bold hover:bg-blue-700"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsRenaming(false)}
                                    className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <h2 className={`font-bold text-slate-900 flex items-center gap-3 group ${selectedTransmittal ? 'text-3xl' : 'text-xl text-slate-500 font-normal mt-2'}`}>
                                {selectedTransmittal || 'Manage and track all project documentation'}
                                {selectedTransmittal && (
                                    <button
                                        onClick={() => {
                                            setNewTransmittalName(selectedTransmittal);
                                            setIsRenaming(true);
                                        }}
                                        className="opacity-30 hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600"
                                        title="Rename Transmittal"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    </button>
                                )}
                            </h2>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* Show export buttons ONLY when viewing a specific transmittal */}
                    {selectedTransmittal && (
                        <>
                            <button
                                onClick={() => handleExport(transmittals[selectedTransmittal], selectedTransmittal)}
                                disabled={isExporting}
                                className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 transition-all shadow-md ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isExporting ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        Export Excel
                                        {!isPro && <Zap size={14} className="text-amber-300 fill-amber-300" />}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleExportPDF(transmittals[selectedTransmittal], selectedTransmittal)}
                                disabled={isExporting}
                                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 transition-all shadow-md ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isExporting ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        Export PDF
                                        {!isPro && <Zap size={14} className="text-amber-300 fill-amber-300" />}
                                    </>
                                )}
                            </button>
                        </>
                    )}
                    {/* Show New Transmittal button ONLY on main dashboard */}
                    {!selectedTransmittal && (
                        <button
                            onClick={() => navigate('/app/upload')}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-lg shadow-slate-200 transition-all"
                        >
                            New Transmittal
                        </button>
                    )}
                </div>
            </header>

            {/* Transmittal Grid View */}
            {!selectedTransmittal && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Plan Usage Card / Skeleton */}
                    {isLoading && !isInitialized ? (
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden animate-pulse">
                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-3">
                                    <div className="h-4 w-24 bg-slate-800 rounded"></div>
                                    <div className="h-8 w-32 bg-slate-800 rounded"></div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-800 w-12 h-12"></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-3 w-20 bg-slate-800 rounded"></div>
                                    <div className="h-3 w-12 bg-slate-800 rounded"></div>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full"></div>
                                <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`p-6 rounded-xl shadow-lg relative overflow-hidden group cursor-pointer transition-all ${isPro ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700' : 'bg-slate-900 text-white'}`}
                            onClick={() => !isPro && setIsUpgradeModalOpen(true)}
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Zap size={80} />
                            </div>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium mb-1">Current Plan</p>
                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        {subscriptionTier === 'business' ? 'Business Plan' : subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                                        {isPro && <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">ACTIVE</span>}
                                    </h3>
                                </div>
                                {isPro && <Zap className="text-blue-400 fill-blue-400" size={24} />}
                            </div>

                            <div className="mt-4">
                                {/* Usage Alert */}
                                {documentsUsed >= documentLimit * 0.8 && !isPro && (
                                    <div className={`mb-4 p-3 rounded-lg border-2 ${documentsUsed >= documentLimit
                                        ? 'bg-red-50 border-red-300'
                                        : 'bg-orange-50 border-orange-300'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Zap size={18} className={`shrink-0 ${documentsUsed >= documentLimit
                                                ? 'text-red-600 fill-red-600'
                                                : 'text-orange-600 fill-orange-600'
                                                }`} />
                                            <p className={`text-sm font-bold ${documentsUsed >= documentLimit
                                                ? 'text-red-900'
                                                : 'text-orange-900'
                                                }`}>
                                                {documentsUsed >= documentLimit ? 'Limit Reached!' : 'Approaching Limit'}
                                            </p>
                                        </div>
                                        <p className={`text-sm leading-snug ${documentsUsed >= documentLimit
                                            ? 'text-red-800'
                                            : 'text-orange-800'
                                            }`}>
                                            You've used <span className="font-bold">{documentsUsed} of {documentLimit}</span> documents this month.
                                            {documentsUsed >= documentLimit && ' Upgrade to continue.'}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm text-slate-300">Monthly Usage</span>
                                    <span className={`font-bold ${documentsUsed >= documentLimit ? 'text-red-400' : 'text-white'}`}>
                                        {documentsUsed} / {documentLimit}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${isPro ? 'bg-green-500'
                                            : documentsUsed >= documentLimit ? 'bg-red-500'
                                                : documentsUsed >= documentLimit * 0.8 ? 'bg-amber-500'
                                                    : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min((documentsUsed / documentLimit) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    {isPro ? 'Unlimited documents & exports included' : 'Upgrade for more features and credits'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Folder Skeletons While Loading */}
                    {isLoading && Array.from({ length: 2 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-100 rounded-lg w-12 h-12"></div>
                                <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
                            </div>
                            <div className="h-6 w-3/4 bg-slate-100 rounded mb-2"></div>
                            <div className="h-4 w-1/2 bg-slate-100 rounded mb-4"></div>
                            <div className="w-full pt-4 border-t border-slate-100 flex justify-between items-center">
                                <div className="h-4 w-20 bg-slate-100 rounded"></div>
                                <div className="h-4 w-4 bg-slate-100 rounded"></div>
                            </div>
                        </div>
                    ))}

                    {!isLoading && Object.entries(transmittals).map(([title, docs]) => (
                        <div
                            key={title}
                            onClick={() => setSelectedTransmittal(title)}
                            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <Folder size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                                        {docs.length} Docs
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteTransmittal(e, title)}
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                        title="Delete Transmittal"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1" title={title}>{title}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                <Calendar size={14} />
                                <span>{new Date(docs[0].uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="w-full pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600">View Files</span>
                                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                        </div>
                    ))}

                    {!isLoading && isInitialized && Object.keys(transmittals).length === 0 && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center text-center bg-slate-50/50">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                                <Folder size={40} className="text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No documents yet</h3>
                            <p className="text-slate-500 max-w-md mb-8">
                                Upload your construction drawings, transmittals, or document registers to automatically extract data.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl w-full mb-8 text-left">
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="p-2 bg-green-50 w-fit rounded-lg mb-3">
                                        <Zap size={20} className="text-green-600" />
                                    </div>
                                    <h4 className="font-semibold text-slate-800 mb-1">AI Extraction</h4>
                                    <p className="text-xs text-slate-500">Auto-detects document numbers, revisions, and titles.</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="p-2 bg-blue-50 w-fit rounded-lg mb-3">
                                        <Folder size={20} className="text-blue-600" />
                                    </div>
                                    <h4 className="font-semibold text-slate-800 mb-1">Smart Sorting</h4>
                                    <p className="text-xs text-slate-500">Groups documents into transmittal packages automatically.</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="p-2 bg-purple-50 w-fit rounded-lg mb-3">
                                        <Download size={20} className="text-purple-600" />
                                    </div>
                                    <h4 className="font-semibold text-slate-800 mb-1">Easy Export</h4>
                                    <p className="text-xs text-slate-500">Export to Excel or PDF with a single click.</p>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/app/upload')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                            >
                                <Download size={20} className="rotate-180" />
                                Upload Your First Document
                            </button>
                        </div>
                    )}
                </div>
            )
            }

            {/* Detailed Document View */}
            {selectedTransmittal && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="px-4 py-3 font-semibold min-w-[220px]">Number</th>
                                    <th className="px-4 py-3 font-semibold">Rev</th>
                                    <th className="px-4 py-3 font-semibold hidden xl:table-cell">Type</th>
                                    <th className="px-4 py-3 font-semibold">Title</th>
                                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Discipline</th>
                                    <th className="px-4 py-3 font-semibold hidden lg:table-cell">Consultant</th>
                                    <th className="px-4 py-3 font-semibold">Date</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold hidden 2xl:table-cell">Summary</th>
                                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transmittals[selectedTransmittal]?.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{doc.documentNumber}</td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{doc.revision}</td>
                                        <td className="px-4 py-3 text-slate-600 hidden xl:table-cell text-xs font-semibold">{doc.documentType || (doc.filename ? doc.filename.split('.').pop()?.toUpperCase() : '-')}</td>
                                        <td className="px-4 py-3 text-slate-900 min-w-[300px] max-w-sm truncate" title={doc.title}>{doc.title}</td>
                                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs whitespace-nowrap">
                                                {doc.discipline || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 hidden lg:table-cell truncate max-w-[150px]" title={doc.consultant || '-'}>{doc.consultant || '-'}</td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{doc.issueDate}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs hidden 2xl:table-cell max-w-sm truncate" title={doc.summary || '-'}>{doc.summary || '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={(e) => handleDeleteDocument(e, doc.id, doc.documentNumber)}
                                                className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete Document"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default Dashboard;
