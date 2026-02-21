import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { pdf } from 'pdf-to-img';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedData {
    documentNumber?: string;
    revision?: string;
    title?: string;
    issueDate?: string;
    discipline?: string;
    consultant?: string;
    summary?: string;
    transmittalTitle?: string;
    documentType?: string; // e.g., "Drawing", "Specification", "Report", "Transmittal", "Schedule"
    status?: string; // e.g., "S2", "S3", "S4", "A1", "B1", "For Construction", "Preliminary"
    fileHash?: string; // MD5 hash for duplicate detection
}

export const extractDocumentData = async (fileBuffer: Buffer, fileName: string): Promise<ExtractedData> => {
    console.log(`[AI Service] Starting extraction for: ${fileName}`);

    try {
        let contentToAnalyze: string;
        let isImage = false;
        const fileExt = (fileName.toLowerCase().split('.').pop() || '') as string;

        // 1. Determine File Type & Extract Content
        if (fileExt === 'pdf') {
            console.log('[AI Service] Detected PDF. Attempting text extraction...');
            try {
                const parser = new PDFParse({ data: fileBuffer });
                const pdfData = await parser.getText();
                await parser.destroy();
                contentToAnalyze = pdfData.text;
                console.log(`[AI Service] PDF Text Extracted. Length: ${contentToAnalyze.length} chars`);

                if (!contentToAnalyze || contentToAnalyze.trim().length < 50) {
                    console.warn("[AI Service] PDF text is empty or too short. Likely scanned.");
                    throw new Error("SCANNED_PDF_DETECTED");
                }

                if (contentToAnalyze.length > 50000) {
                    console.log('[AI Service] Text too long, truncating to 50k chars');
                    contentToAnalyze = contentToAnalyze.substring(0, 50000);
                }
            } catch (pdfError: any) {
                if (pdfError.message === "SCANNED_PDF_DETECTED" || pdfError.message.includes("scanned PDF")) {
                    console.log("[AI Service] Scanned PDF detected. Switching to Vision/OCR mode (First 3 Pages)...");
                    const pdfBase64 = fileBuffer.toString('base64');
                    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

                    // Read first 3 pages for better metadata extraction
                    const document = await pdf(pdfDataUrl, { scale: 2.0 });
                    const pageImages: string[] = [];

                    // Try to get up to 3 pages (will fail gracefully if document has fewer)
                    console.log(`[AI Service] Processing first 3 pages of scanned PDF...`);

                    for (let i = 1; i <= 3; i++) {
                        try {
                            const imageBuffer = await document.getPage(i);
                            pageImages.push(`data:image/png;base64,${imageBuffer.toString('base64')}`);
                        } catch (pageError) {
                            // Page doesn't exist, stop processing
                            console.log(`[AI Service] Page ${i} not available, stopping at ${pageImages.length} page(s)`);
                            break;
                        }
                    }

                    // Combine multiple pages into the content
                    contentToAnalyze = pageImages.join('|||PAGE_BREAK|||');
                    isImage = true;
                    console.log(`[AI Service] Converted ${pageImages.length} PDF page(s) to images.`);
                } else {
                    console.error("[AI Service] PDF Parsing Failed:", pdfError);
                    throw new Error("Failed to read PDF text. File might be corrupted or password protected.");
                }
            }
        } else if (fileExt === 'docx' || fileExt === 'doc') {
            console.log('[AI Service] Detected Word Document. Extracting text...');
            if (fileExt === 'doc') {
                throw new Error("Legacy .doc format is not fully supported. Please save as .docx and try again.");
            }
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            contentToAnalyze = result.value;
            console.log(`[AI Service] Word Text Extracted. Length: ${contentToAnalyze.length} chars`);
            if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
                throw new Error("Word document appears empty.");
            }
        } else if (fileExt === 'xlsx' || fileExt === 'xls') {
            console.log('[AI Service] Detected Excel Spreadsheet. Extracting data...');
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            // Convert to CSV for easier token processing by AI
            contentToAnalyze = XLSX.utils.sheet_to_csv(sheet);
            console.log(`[AI Service] Excel Data (Sheet 1) Extracted. Length: ${contentToAnalyze.length} chars`);
            if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
                throw new Error("Excel file appears empty.");
            }
            // Truncate if too long
            if (contentToAnalyze.length > 50000) {
                contentToAnalyze = contentToAnalyze.substring(0, 50000);
            }
        } else if (fileExt === 'txt') {
            console.log('[AI Service] Detected Plain Text File. Reading content...');
            contentToAnalyze = fileBuffer.toString('utf-8');
            console.log(`[AI Service] Text Content Extracted. Length: ${contentToAnalyze.length} chars`);
            if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
                throw new Error("Text file appears empty.");
            }
            // Truncate if too long
            if (contentToAnalyze.length > 50000) {
                contentToAnalyze = contentToAnalyze.substring(0, 50000);
            }
        } else if (fileExt === 'csv') {
            console.log('[AI Service] Detected CSV File. Reading content...');
            contentToAnalyze = fileBuffer.toString('utf-8');
            console.log(`[AI Service] CSV Content Extracted. Length: ${contentToAnalyze.length} chars`);
            if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
                throw new Error("CSV file appears empty.");
            }
            // Truncate if too long
            if (contentToAnalyze.length > 50000) {
                contentToAnalyze = contentToAnalyze.substring(0, 50000);
            }
        } else if (fileExt === 'dxf') {
            console.log('[AI Service] Detected DXF File (AutoCAD Drawing Exchange Format). Reading content...');
            contentToAnalyze = fileBuffer.toString('utf-8');
            console.log(`[AI Service] DXF Content Extracted. Length: ${contentToAnalyze.length} chars`);
            if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
                throw new Error("DXF file appears empty.");
            }
            // DXF files can be large - truncate while preserving header section
            // Keep first 50000 chars which usually contains title block info
            if (contentToAnalyze.length > 50000) {
                contentToAnalyze = contentToAnalyze.substring(0, 50000) + '\n[... file truncated for analysis ...]';
            }
        } else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt)) {
            console.log('[AI Service] Detected Image. Preparing for Vision API...');
            contentToAnalyze = `data:image/${fileExt === 'jpg' ? 'jpeg' : fileExt};base64,${fileBuffer.toString('base64')}`;
            isImage = true;
        } else {
            throw new Error(`Unsupported file extension: .${fileExt}`);
        }

        // 2. Prepare Dynamic Prompt based on file type
        let systemPrompt = `
            You are an expert Construction Document Controller familiar with UK industry standards (BS 1192 / ISO 19650).
            Extract metadata from this construction document into strict JSON.
        `;

        if (fileExt === 'xlsx' || fileExt === 'xls') {
            systemPrompt += `
            CONTEXT: This is an Excel spreadsheet. It likely contains a Document Register, Transmittal Sheet, or Schedule.
            INSTRUCTIONS:
            - Look for a header row identifying 'Document Number', 'Rev', 'Title', etc.
            - Extract metadata for the **first significant document entry** listed.
            - If it's a cover sheet/transmittal, extract the metadata of the transmittal itself (e.g. Transmittal Number as Document Number).
            `;
        } else if (fileExt === 'docx' || fileExt === 'doc') {
            systemPrompt += `
            CONTEXT: This is a Word document. It could be a Specification, Report, or Transmittal.
            INSTRUCTIONS:
            - Look for a cover page or header containing document details.
            - Extract the metadata for **this specific document**.
            - If it represents a list of drawings, extract the first item or the collective title.
            `;
        } else {
            // Default (PDFs, Images)
            systemPrompt += `
            VISUAL ANALYSIS INSTRUCTIONS:
            - **TITLE BLOCK LOCATION**: Title blocks may be located **ANYWHERE** on the drawing (bottom-right, bottom strip, right strip, top-right, or even top-left). Scan the entire image to locate the main information panel.
            - **PHOTOS**: If this is a photo of a physical drawing, extract data from the visible title block. If it is a site photo, extract a summary description and set title to "Site Photo".
            - Handwritten text may be present; do your best to transcribe it accurately.
            - Ignore stamps like "RECEIVED" or "CHECKED" unless they contain the status.
            `;
        }

        // Common instructions
        systemPrompt += `
            NAMING CONVENTIONS (UK/ISO 19650 contexts):
            - **Document Number**: Often follows [Project]-[Originator]-[Volume]-[Level]-[Type]-[Role]-[Number] (e.g., "PRJ-ARC-ZZ-00-DR-A-0010") or simple formats like "A-100".
            - **Revision**: Look for "Rev", "Revision", or single/double letters/numbers in the revision box (e.g., "P01", "C1", "A", "0").
            - **Status**: Look for status codes (e.g., "S3", "S4", "A1", "B1") or descriptions like "For Construction", "Preliminary", "Approved".
            
            DISCIPLINE DETECTION (CRITICAL):
            Determine discipline from document number codes, title, or content:
            
            **BS 1192/ISO 19650 Type Codes:**
            - A = Architectural
            - S = Structural
            - M = Mechanical / HVAC
            - E = Electrical
            - P = Plumbing / Public Health
            - C = Civil Engineering
            - L = Landscape
            - Q = Quantity Surveying
            - Z = General / Multi-discipline
            
            **Document Number Patterns:**
            - Format: [Project]-[Originator]-[Volume]-[Level]-DR-**[Type]**-[Number]
            - Example: "PRJ-STR-ZZ-00-DR-S-2001" → Type code "S" = Structural
            - Example: "PRJ-MEP-ZZ-00-DR-M-3050" → Type code "M" = Mechanical
            
            **Alternative Codes & Keywords:**
            - Architectural: "ARCH", "ARC", "A-", contains "Floor Plan", "Elevation"
            - Structural: "STRUCT", "STR", "S-", contains "Foundation", "Frame", "Beam"
            - Mechanical: "MECH", "HVAC", "M-", contains "Ventilation", "Ductwork"
            - Electrical: "ELEC", "E-", contains "Lighting", "Power"
            - Plumbing: "PLUMB", "P-", "PHE", contains "Drainage", "Water"
            - MEP: "MEP", "MEPH" (Mechanical, Electrical, Plumbing combined)
            - Civil: "CIVIL", "C-", contains "Site", "Road"
            - Landscape: "LAND", "L-", contains "Garden"
            
            **Return ONE of these standardized values:**
            "Architectural", "Structural", "Mechanical", "Electrical", "Plumbing", "MEP", "Civil", "Landscape", "General"
            
            FIELDS TO EXTRACT:
            - documentNumber: (string) The main drawing/document number. Prefer the ISO 19650 format if present.
            - revision: (string) The current revision code.
            - title: (string) The drawing/document title.
            - issueDate: (string) Date in YYYY-MM-DD format.
            - discipline: (string) ONE of: "Architectural", "Structural", "Mechanical", "Electrical", "Plumbing", "MEP", "Civil", "Landscape", "General"
            - consultant: (string) Company name in the title block logo/header.
            - summary: (string) Brief description of the content.
            - documentType: (string) Document classification: one of "Drawing", "Specification", "Report", "Schedule", "Transmittal", "Letter", "Form", or "Other".

            Return NULL if a field is not found.
            Return ONLY raw JSON object. No markdown.
        `;

        // For multi-page scanned PDFs, prepare multiple image inputs
        let userMessage: any[];
        if (isImage && contentToAnalyze.includes('|||PAGE_BREAK|||')) {
            // Multiple pages
            const pages = contentToAnalyze.split('|||PAGE_BREAK|||');
            userMessage = [
                { type: "text" as const, text: `Extract data from these ${pages.length} pages of a scanned document. The first pages usually contain the title block and metadata.` },
                ...pages.map(pageUrl => ({ type: "image_url" as const, image_url: { "url": pageUrl } }))
            ];
        } else if (isImage) {
            // Single image
            userMessage = [
                { type: "text" as const, text: "Extract data from this image." },
                { type: "image_url" as const, image_url: { "url": contentToAnalyze } }
            ];
        } else {
            // Text content
            userMessage = [
                { type: "text" as const, text: `Extract data from this text:\n\n${contentToAnalyze}` }
            ];
        }

        console.log('[AI Service] Sending request to OpenAI...');

        // 3. Call OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            max_tokens: 1000,
            temperature: 0.1, // Low temperature for consistent extraction
            response_format: { type: "json_object" }
        }, {
            timeout: 30000 // 30 second timeout to prevent hanging
        });

        console.log('[AI Service] OpenAI Response Received.');

        const content = response.choices[0].message.content;
        if (!content) throw new Error("OpenAI returned no content.");

        // 4. Parse JSON
        try {
            const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonString);
            console.log('[AI Service] Data parsed successfully.');
            return data as ExtractedData;
        } catch (parseError) {
            console.error("[AI Service] JSON Parse Failed. Raw content:", content);
            throw new Error("Failed to parse AI response. See server logs for raw output.");
        }

    } catch (error) {
        console.error("[AI Service] Error:", error);
        throw error;
    }
};
