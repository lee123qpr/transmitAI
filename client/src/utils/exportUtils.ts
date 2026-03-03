export interface DocumentExportData {
    documentNumber?: string;
    revision?: string;
    documentType?: string;
    title?: string;
    status?: string;
    issueDate?: string;
    discipline?: string;
    consultant?: string;
    summary?: string;
}

const fetchImageAsBase64 = async (url: string): Promise<{ base64: string, extension: string } | null> => {
    try {
        if (url.startsWith('data:image')) {
            const match = url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (match) {
                const ext = (match[1] === 'jpeg' || match[1] === 'jpg') ? 'jpeg' : 'png';
                return { base64: match[2], extension: ext };
            }
            return null;
        }

        const res = await fetch(url);
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // Convert strict binary to base64 robustly
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);
        const ext = (blob.type.includes('jpeg') || blob.type.includes('jpg')) ? 'jpeg' : 'png';

        return { base64, extension: ext };
    } catch (e) {
        console.error('Failed to fetch image as base64', e);
        return null;
    }
};

export const exportToExcel = async (
    docsToExport: DocumentExportData[],
    filename: string,
    companyLogoUrl?: string | null,
    companyName?: string | null
) => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const safeSheetName = (filename || 'Transmittal Register').substring(0, 31).replace(/[\[\]\*\/\\\?\:]/g, '_');
    const worksheet = workbook.addWorksheet(safeSheetName);

    // Optional Company Logo
    if (companyLogoUrl) {
        const logoData = await fetchImageAsBase64(companyLogoUrl);
        if (logoData) {
            try {
                const logoId = workbook.addImage({
                    base64: logoData.base64,
                    extension: logoData.extension as 'jpeg' | 'png',
                });
                worksheet.addImage(logoId, {
                    tl: { col: 7, row: 0 }, // Column H
                    ext: { width: 120, height: 40 },
                    editAs: 'absolute'
                });
            } catch (e) {
                console.error('Failed to embed excel logo', e);
            }
        }
    }

    worksheet.columns = [
        { key: 'documentNumber', width: 22 },
        { key: 'revision', width: 12 },
        { key: 'documentType', width: 15 },
        { key: 'title', width: 45 },
        { key: 'status', width: 18 },
        { key: 'issueDate', width: 15 },
        { key: 'discipline', width: 18 },
        { key: 'consultant', width: 25 },
        { key: 'summary', width: 80 },
    ];

    worksheet.getCell('A1').value = filename || 'Transmittal Register';
    worksheet.getCell('A1').font = { size: 14, bold: true };
    worksheet.getCell('A2').value = `Exported: ${new Date().toLocaleDateString('en-GB')}`;
    worksheet.getCell('A2').font = { size: 10, italic: true };

    if (companyName) {
        worksheet.getCell('A3').value = `Company: ${companyName}`;
        worksheet.getCell('A3').font = { size: 11, bold: true };
    }

    // Set headers
    const headerRow = worksheet.getRow(5);
    headerRow.values = ['Doc Number', 'Revision', 'Type', 'Title', 'Status', 'Issue Date', 'Discipline', 'Consultant', 'Summary'];
    headerRow.font = { bold: true };
    headerRow.border = { bottom: { style: 'thin' } };

    // Sort documents simply by Doc Number
    const sortedDocs = [...docsToExport].sort((a, b) => {
        return (a.documentNumber || '').localeCompare(b.documentNumber || '');
    });

    sortedDocs.forEach((doc) => {
        worksheet.addRow({
            ...doc,
            documentType: doc.documentType || doc.title?.split('.').pop()?.toUpperCase() || ''
        });
    });

    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const finalFilename = filename ? `${filename.replace(/[^a-z0-9]/gi, '_')}.xlsx` : 'extracted_data.xlsx';
    anchor.download = finalFilename;
    anchor.click();
    window.URL.revokeObjectURL(url);

    return finalFilename;
};

export const exportToPDF = async (
    docsToExport: DocumentExportData[],
    filename: string,
    companyLogoUrl?: string | null,
    companyName?: string | null
) => {
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
    doc.text(filename || 'Transmittal Register', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exported: ${new Date().toLocaleDateString('en-GB')}`, 105, 22, { align: 'center' });
    doc.text(`Total Documents: ${docsToExport.length}`, 105, 28, { align: 'center' });

    let hasLogo = false;
    if (companyLogoUrl) {
        const logoData = await fetchImageAsBase64(companyLogoUrl);
        if (logoData) {
            try {
                const imgFormat = logoData.extension.toUpperCase();
                // Pass the data URI format expected by jsPDF
                const dataUri = `data:image/${logoData.extension};base64,${logoData.base64}`;
                doc.addImage(dataUri, imgFormat, 14, 5, 25, 25, undefined, 'FAST');
                hasLogo = true;
            } catch (e) {
                console.error('PDF logo add error', e);
            }
        }
    }

    if (companyName) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, hasLogo ? 43 : 14, 20);
    }

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
    const disciplineGroups: Record<string, DocumentExportData[]> = {};
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
        doc.text(`${discipline.toUpperCase()} `, 16, yPos + 5.5);
        yPos += 10;

        doc.setTextColor(0, 0, 0);

        // Create table for this discipline
        const tableBody = disciplineDocs.map(d => [
            d.documentNumber || '-',
            d.revision || '-',
            d.documentType || d.title?.split('.').pop()?.toUpperCase() || '-',
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
                const pageCount = (doc as any).internal.getNumberOfPages();
                const pageHeight = doc.internal.pageSize.height;
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(`Page ${(doc as any).internal.getCurrentPageInfo().pageNumber} of ${pageCount} `, 105, pageHeight - 10, { align: 'center' });

                // User branding
                doc.setTextColor(59, 130, 246);
                doc.text('Made by Transmit.AI - transmittal.co.uk', 283, pageHeight - 10, { align: 'right' });
            }
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
    });

    const finalFilename = filename ? `${filename.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'extracted_data.pdf';
    doc.save(finalFilename);

    return finalFilename;
};
