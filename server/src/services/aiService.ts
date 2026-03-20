import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
// ESM-only modules must be imported dynamically in CommonJS environments
// import { pdf } from 'pdf-to-img';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import sharp from 'sharp';
import { normalizeConsultantName, validateExtraction } from '../utils/aiValidation';

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
    confidence_score?: number; // AI confidence score 1-100
    reasoning_notes?: string;   // AI's reasoning for the score or missing fields
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
                const pdfData = await pdfParse(fileBuffer);
                contentToAnalyze = pdfData.text;
                console.log(`[AI Service] PDF Text Extracted. Length: ${contentToAnalyze.length} chars`);

                if (!contentToAnalyze || contentToAnalyze.trim().length < 50) {
                    console.warn("[AI Service] PDF text is empty or too short. Likely scanned.");
                    throw new Error("SCANNED_PDF_DETECTED");
                }

                // Detect CAD vector-glyph exports: these PDFs contain mostly vector paths (high file size)
                // but very little extractable text. A normal text document has >5 chars of text per KB of file size.
                // CAD drawings stored as outlines/paths can be 100KB+ but yield under 500 chars of useful text.
                const textPerKb = contentToAnalyze.length / (fileBuffer.length / 1024);
                if (textPerKb < 5 && contentToAnalyze.length < 1000) {
                    console.warn(`[AI Service] CAD vector-export PDF detected (${contentToAnalyze.length} chars text, ${(fileBuffer.length/1024).toFixed(0)}KB file = ${textPerKb.toFixed(1)} chars/KB). Forcing Vision/Edge-Slicing mode.`);
                    // Save the garbled text as backup BEFORE entering Vision mode
                    const cadGarbledTextFallback = contentToAnalyze;
                    throw Object.assign(new Error("SCANNED_PDF_DETECTED"), { cadFallbackText: cadGarbledTextFallback });
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

                    // Vercel bundle hack: Force @vercel/nft to trace the ESM dependency tree
                    // @ts-ignore
                    if (process.env.VERCEL_FORCE_BUNDLE === 'true') {
                        require('pdf-to-img');
                        require('pdfjs-dist');
                    }

                    // Workaround for TypeScript converting dynamic import to require() in CommonJS
                    const { pdf: pdfImg } = await Function('return import("pdf-to-img")')();

                    // Start at lower scale (1.0 not 1.5) for CAD drawings to reduce Vercel memory pressure
                    const scalesToTry = [1.0, 0.75, 0.5];
                    const pageImages: string[] = [];
                    // Grab any fallback garbled text saved before entering Vision mode
                    const cadFallbackText: string | undefined = (pdfError as any).cadFallbackText;
                    
                    for (const scale of scalesToTry) {
                        try {
                            console.log(`[AI Service] Attempting to parse and render PDF with scale: ${scale}`);
                            const document = await pdfImg(pdfDataUrl, { scale });
                            
                            // Reset pageImages for this new scale attempt
                            pageImages.length = 0; 
                            
                            // Try to get up to 5 pages for long specifications/reports
                            for (let i = 1; i <= 5; i++) {
                                try {
                                    const rawImageBuffer = await document.getPage(i);
                                    
                                        if (i === 1) {
                                        const metadata = await sharp(rawImageBuffer).metadata();
                                        const pixelArea = (metadata.width || 0) * (metadata.height || 0);
                                        // Detect large drawings by pixel area (catches portrait-saved landscape drawings too)
                                        // ~1,500,000 pixels covers anything A2+ at default rendering scale
                                        // An A4 PDF at 1.5x scale is roughly 892x1263 = ~1.1M px, so we go slightly higher
                                        const isLargeDrawing = pixelArea > 1_400_000;
                                        const orientationLabel = (metadata.width || 0) > (metadata.height || 0) ? 'landscape' : 'portrait';

                                        if (isLargeDrawing) {
                                            console.log(`[AI Service] Large drawing detected (${metadata.width}x${metadata.height}, ${orientationLabel}, area=${pixelArea.toLocaleString()}px). Applying 4-edge title block slicing.`);
                                            
                                            // 4-corner crop strategy: title blocks may appear on ANY edge
                                            // (bottom-right is standard BS1192, but many UK firms use left-side or bottom strips)
                                            
                                            // 1. Left Edge Strip (15% width, full height) — catches left-side title blocks like "SURVEY DRAWINGS"
                                            const cropWidthL = Math.floor(metadata.width * 0.15);
                                            const leftEdge = await sharp(rawImageBuffer).extract({ left: 0, top: 0, width: cropWidthL, height: metadata.height }).toBuffer();
                                            pageImages.push(`data:image/png;base64,${leftEdge.toString('base64')}`);

                                            // 2. Bottom Strip (full width, 20% height) — catches bottom-strip title blocks
                                            const cropHeightBot = Math.floor(metadata.height * 0.20);
                                            const topBot = metadata.height - cropHeightBot;
                                            const bottomStrip = await sharp(rawImageBuffer).extract({ left: 0, top: topBot, width: metadata.width, height: cropHeightBot }).toBuffer();
                                            pageImages.push(`data:image/png;base64,${bottomStrip.toString('base64')}`);

                                            // 3. Right Edge Strip (15% width, full height) — catches right-side title blocks
                                            const cropWidthR = Math.floor(metadata.width * 0.15);
                                            const leftR = metadata.width - cropWidthR;
                                            const rightEdge = await sharp(rawImageBuffer).extract({ left: leftR, top: 0, width: cropWidthR, height: metadata.height }).toBuffer();
                                            pageImages.push(`data:image/png;base64,${rightEdge.toString('base64')}`);

                                            // 4. Top Strip (full width, 15% height) — catches top-strip title blocks
                                            const cropHeightTop = Math.floor(metadata.height * 0.15);
                                            const topStrip = await sharp(rawImageBuffer).extract({ left: 0, top: 0, width: metadata.width, height: cropHeightTop }).toBuffer();
                                            pageImages.push(`data:image/png;base64,${topStrip.toString('base64')}`);
                                            
                                            break; // Stop parsing more pages — title block is all we need for drawings.
                                        } else {
                                            // Standard A4 portrait report/spec - push full page
                                            pageImages.push(`data:image/png;base64,${rawImageBuffer.toString('base64')}`);
                                        }
                                    } else {
                                        // Pages 2-5 for Standard A4
                                        pageImages.push(`data:image/png;base64,${rawImageBuffer.toString('base64')}`);
                                    }
                                } catch (pageError: any) {
                                    // If it's just 'page missing' or generic error, that's fine, break inner loop.
                                    // But if it's explicitly a memory/canvas limit error, we want it to bubble up to the scale fallback!
                                    if (pageError.message?.toLowerCase().includes('canvas') || 
                                        pageError.message?.toLowerCase().includes('memory') || 
                                        pageError.message?.toLowerCase().includes('size')) {
                                        throw pageError; // Bubble up
                                    }
                                    console.log(`[AI Service] Page ${i} limit reached or unavailable, stopping at ${pageImages.length} page(s)`);
                                    break;
                                }
                            }
                            
                            if (pageImages.length > 0) {
                                break; // Successfully loaded at least 1 page at this scale
                            }
                        } catch (memoryError) {
                            console.warn(`[AI Service] Visual parsing failed at scale ${scale}`, memoryError);
                            if (scale === scalesToTry[scalesToTry.length - 1]) {
                                // All rendering scales exhausted. 
                                // If we have fallback garbled text from a CAD drawing, use that instead of failing hard.
                                if (cadFallbackText && cadFallbackText.trim().length > 0) {
                                    console.warn('[AI Service] All Vision scales failed. Falling back to garbled text extraction with context prompt.');
                                    contentToAnalyze = `[NOTE: This is a CAD-exported drawing. The following text was extracted from vector paths and may be garbled or character-by-character. Do your best to reconstruct the document title, number and other fields from this data:]\n\n${cadFallbackText}`;
                                    isImage = false;
                                } else {
                                    console.error("[AI Service] Visual parsing failed completely (all scales exhausted):", memoryError);
                                    throw new Error("This document could not be automatically analysed due to its exceedingly large visual complexity.");
                                }
                            }
                        }
                    }

                    if (pageImages.length === 0) {
                        throw new Error("Could not extract any readable images from this scanned PDF. Please try a different file.");
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
            - **TITLE BLOCK**: The title block is a formal bordered panel (usually a table or grid) containing clearly labelled rows/columns such as "TITLE:", "CLIENT:", "DRAWING NO:", "SCALE:", "DATE:", "REV:". It is typically at the LEFT EDGE, BOTTOM EDGE, or RIGHT EDGE of a drawing. FIND THIS PANEL.
            - **TITLE FIELD RULE**: The "title" field MUST be the text found inside the "TITLE" labelled cell/row of the title block panel (e.g. "SURVEY DRAWINGS", "GROUND FLOOR PLAN", "ROOF PLAN"). 
            - **CRITICAL WARNING**: Do NOT use any text from within the main drawing content as the title. Specifically, labels like "SITE PLAN 1:1250", "BLOCK PLAN", "NORTH ELEVATION" printed next to or within the plan view are SCALE NOTES or VIEW LABELS — they are NOT the document title.
            - **PHOTOS**: If this is a photo of a physical drawing, extract data from the visible title block panel. If it is a site photo, extract a summary description and set title to "Site Photo".
            - Handwritten text may be present; do your best to transcribe it accurately.
            - Ignore stamps like "RECEIVED" or "CHECKED" unless they contain the status.
            `;
        }

        // Common instructions
        systemPrompt += `
            NAMING CONVENTIONS (UK/ISO 19650 contexts):
            - **Document Number**: Often follows [Project]-[Originator]-[Volume]-[Level]-[Type]-[Role]-[Number] (e.g., "PRJ-ARC-ZZ-00-DR-A-0010") or simple formats like "A-100".
            - **Revision**: Look for "Rev", "Revision", or single/double letters/numbers in the revision box (e.g., "P01", "C1", "A", "0"). Pay VERY close attention to the title block for this, as it is critical.
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
            - consultant: (string) Company name in the title block logo/header. IMPORTANT: Normalize the company name by removing legal entity suffixes (e.g., remove "Ltd", "LLP", "Inc", "Consulting", "Group"). For example, "Arup Consulting Ltd" should just be "Arup".
            - status: (string) The drawing/document status (e.g., "For Construction", "Preliminary", "S2", etc).
            - summary: (string) Brief description of the content.
            - documentType: (string) Document classification: one of "Drawing", "Specification", "Report", "Schedule", "Transmittal", "Letter", "Form", or "Other".
            
            QUALITY SCORE INSTRUCTIONS:
            - confidence_score: (number) Choose a value from 1 to 100 representing how confident you are in the extracted data. Deduct points if core fields (documentNumber, title, revision, status) are missing, if text is blurry/hard to read, or if standard naming conventions are not followed. High confidence (90+) means almost all fields found and standard formats used.
            - reasoning_notes: (string) Provide a concise, helpful explanation for the user if the score is not 100. Specifically mention any missing fields, poor image quality, or deviations from ISO 19650 conventions. If the score is 100, return an empty string.

            IMPORTANT: Return "" (empty string) or 0 if a field is not found. Do not return null.
        `;

        // For multi-page scanned PDFs, prepare multiple image inputs
        let userMessage: any[];
        if (isImage && contentToAnalyze.includes('|||PAGE_BREAK|||')) {
            // Multiple pages
            const pages = contentToAnalyze.split('|||PAGE_BREAK|||');
            userMessage = [
                { type: "text" as const, text: `These ${pages.length} images are HIGH-RESOLUTION EDGE CROPS of a large construction drawing.\n\nImage order: [Left Edge Strip] → [Bottom Strip] → [Right Edge Strip] → [Top Strip]\n\nCRITICAL INSTRUCTIONS:\n- The TITLE BLOCK is a bordered panel containing labelled fields like \"TITLE:\", \"CLIENT:\", \"DRAWING NO:\", \"SCALE:\", \"DATE:\", \"REV:\". Find it in ONE of these edge images.\n- Extract the TITLE from the labelled TITLE field in the title block (e.g. \"SURVEY DRAWINGS\", \"GROUND FLOOR PLAN\").\n- DO NOT use any labels printed as plan view notes within the drawing content itself (e.g. \"SITE PLAN 1:1250\" printed next to a map is a scale note, NOT the document title).\n- The DRAWING NUMBER is typically in a \"DRAWING NO.\" or \"DRG NO.\" box (e.g. \"190328/01\", \"1132-01\").\n- The REVISION is in a small \"REV\" or \"REVISION\" box — usually a letter or short code.\n- If the same field appears in multiple edge images, use the value from the most clearly labelled title block panel.` },
                ...pages.map(pageUrl => ({ type: "image_url" as const, image_url: { "url": pageUrl, "detail": "high" } }))
            ];
        } else if (isImage) {
            // Single image
            userMessage = [
                { type: "text" as const, text: "Extract data from this image." },
                { type: "image_url" as const, image_url: { "url": contentToAnalyze, "detail": "high" } }
            ];
        } else {
            // Text content
            userMessage = [
                { type: "text" as const, text: `Extract data from this text:\n\n${contentToAnalyze}` }
            ];
        }

        console.log('[AI Service] Sending request to OpenAI...');

        // 3. Call OpenAI using Structured Outputs
        let response;
        let attempt = 0;
        const maxRetries = 4;

        while (attempt < maxRetries) {
            try {
                response = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                    max_tokens: 1500,
                    temperature: 0.1, // Low temperature for consistent extraction
                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "transmittal_extraction",
                            strict: true,
                            schema: {
                                type: "object",
                                properties: {
                                    documentNumber: { type: "string", description: "The main drawing/document number. Prefer the ISO 19650 format if present." },
                                    revision: { type: "string", description: "The current revision code." },
                                    title: { type: "string", description: "The drawing/document title." },
                                    issueDate: { type: "string", description: "Date in YYYY-MM-DD format." },
                                    discipline: {
                                        type: "string",
                                        enum: ["Architectural", "Structural", "Mechanical", "Electrical", "Plumbing", "MEP", "Civil", "Landscape", "General", "Unknown"],
                                        description: "The detected discipline code."
                                    },
                                    consultant: { type: "string", description: "Company name in the title block logo/header. Normalized to remove Ltd/LLP/etc." },
                                    status: { type: "string", description: "The drawing/document status (e.g., 'For Construction', 'Preliminary', 'S2', etc)." },
                                    summary: { type: "string", description: "Brief description of the content." },
                                    documentType: { type: "string", description: "Document classification: one of 'Drawing', 'Specification', 'Report', 'Schedule', 'Transmittal', 'Letter', 'Form', or 'Other'." },
                                    transmittalTitle: { type: "string", description: "If this is a transmittal/cover sheet, the Transmittal Number." },
                                    confidence_score: { type: "number", description: "Confidence score from 1-100." },
                                    reasoning_notes: { type: "string", description: "Concise reasoning for the given confidence score." }
                                },
                                required: [
                                    "documentNumber",
                                    "revision",
                                    "title",
                                    "issueDate",
                                    "discipline",
                                    "consultant",
                                    "status",
                                    "summary",
                                    "documentType",
                                    "transmittalTitle",
                                    "confidence_score",
                                    "reasoning_notes"
                                ],
                                additionalProperties: false
                            }
                        }
                    }
                }, {
                    timeout: 45000 // Increased timeout for strict schema generation
                });
                
                break; // Success, exit retry loop
            } catch (apiError: any) {
                if (apiError?.status === 429 && attempt < maxRetries - 1) {
                    attempt++;
                    const waitTime = Math.pow(2, attempt) * 1500 + Math.random() * 1000;
                    console.warn(`[AI Service] 429 Rate Limit hit. Retrying in ${Math.round(waitTime/1000)}s... (Attempt ${attempt} of ${maxRetries - 1})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    throw apiError;
                }
            }
        }

        console.log('[AI Service] OpenAI Response Received. Total tokens:', response?.usage?.total_tokens);

        const content = response?.choices?.[0]?.message?.content;
        if (!content) throw new Error("OpenAI returned no content.");

        // 4. Parse JSON & Run Phase 2 + Phase 3 Validation
        try {
            const data = JSON.parse(content);
            console.log('[AI Service] Data parsed successfully from Structured Output.');

            // Clean up: For any empty strings (""), set them to undefined
            const cleanData: ExtractedData = { ...data };
            (Object.keys(cleanData) as (keyof ExtractedData)[]).forEach(key => {
                if (cleanData[key] === "") {
                    cleanData[key] = undefined as any;
                }
            });

            // Phase 2: Normalise Consultant Name
            cleanData.consultant = normalizeConsultantName(cleanData.consultant);

            // Phase 2: Validate the extraction
            const isDrawingDoc = isImage; // Scanned PDF drawing = image mode
            const failingFields = validateExtraction(cleanData, isDrawingDoc);

            if (failingFields.length > 0) {
                console.warn(`[AI Service] Phase 2 Validation FAILED. Missing/invalid fields: [${failingFields.join(', ')}]. Triggering Phase 3 correction pass...`);

                // Phase 3: Second targeted AI pass to fix specific failing fields
                const correctionPrompt = `You are reviewing your own previous extraction of a construction document.

The previous extraction returned:
${JSON.stringify(cleanData, null, 2)}

The following fields are MISSING or INVALID and MUST be corrected: [${failingFields.join(', ')}]

Search the document image(s) again very carefully. For each failing field:
- documentNumber: Look for any alphanumeric code that could be a drawing/document reference. Check corners, headers, footers, and the title block. It may be formatted as "1132-01", "A-100", or similar.
- revision: Look for a small box labelled "Rev", "Revision", or "Issue" in the title block. It is usually a single letter or number like "P1", "C2", "A", "0".
- title: The title should be the main text describing the drawing or document content.

Return ONLY a corrected JSON with the SAME schema as before. Do not invent data — if truly not visible, return an empty string for that field.`;

                try {
                    const correctionResponse = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                            { role: "system", content: correctionPrompt },
                            { role: "user", content: userMessage }
                        ],
                        max_tokens: 1000,
                        temperature: 0,  // Zero temp for maximum determinism
                        response_format: { type: "json_object" },
                    }, { timeout: 30000 });

                    const correctionContent = correctionResponse?.choices?.[0]?.message?.content;
                    if (correctionContent) {
                        const correctedData = JSON.parse(correctionContent);
                        // Merge: only use corrected values for the specific failing fields
                        for (const field of failingFields) {
                            const correctedVal = correctedData[field];
                            if (correctedVal && correctedVal.toString().trim() !== '') {
                                (cleanData as any)[field] = correctedVal;
                                console.log(`[AI Service] Phase 3 Correction: Fixed [${field}] => "${correctedVal}"`);
                            }
                        }
                        // Re-normalise consultant if it was one of the fixed fields
                        cleanData.consultant = normalizeConsultantName(cleanData.consultant);
                    }
                } catch (correctionError) {
                    // Phase 3 failing is non-fatal - we still return the best data we have
                    console.warn('[AI Service] Phase 3 correction pass failed (non-fatal):', correctionError);
                }
            } else {
                console.log('[AI Service] Phase 2 Validation PASSED. All core fields present.');
            }

            return cleanData;
        } catch (parseError) {
            console.error("[AI Service] JSON Parse Failed. Raw content:", content);
            throw new Error("Failed to parse AI response. See server logs for raw output.");
        }

    } catch (error) {
        console.error("[AI Service] Error:", error);
        throw error;
    }
};
