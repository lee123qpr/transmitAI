export function normalizeConsultantName(consultant?: string): string | undefined {
    if (!consultant) return undefined;
    let clean = consultant.trim();
    
    // Remove common legal entity suffixes
    const suffixes = [
        /,\s*Ltd\.?$/i,
        /\s+Ltd\.?$/i,
        /,\s*Limited$/i,
        /\s+Limited$/i,
        /,\s*LLP$/i,
        /\s+LLP$/i,
        /,\s*Inc\.?$/i,
        /\s+Inc\.?$/i,
        /,\s*LLC$/i,
        /\s+LLC$/i,
        /\s+Consulting$/i,
        /\s+Consultants$/i,
        /\s+Group$/i,
        /\s+Associates$/i,
        /\s+Architects$/i,
        /\s+Engineers$/i,
        /\s+Partnership$/i
    ];

    for (const regex of suffixes) {
        clean = clean.replace(regex, '');
    }

    return clean.trim();
}

/**
 * Checks if a revision code looks sane.
 * Acceptable: P01, C1, A, 0, 01, "-", "TBA"
 * Unacceptable: "Revision P01", sentences, long strings, "N/A" if it clearly missed it
 */
export function isValidRevision(rev?: string): boolean {
    if (!rev) return false;
    const clean = rev.trim().toUpperCase();
    
    // Most revisions are 1-4 characters: "P01", "C2", "A", "01"
    if (clean.length > 5) return false;
    
    return true; // We keep this simple initially to avoid false positives
}

/**
 * Validates drawing numbers for general sanity. 
 * Doesn't strictly enforce BS1192 since some older projects use "A-100".
 * But fails sentences or multi-line paragraphs the AI might hallucinate.
 */
export function isValidDocumentNumber(docNum?: string): boolean {
    if (!docNum) return false;
    const clean = docNum.trim();
    
    // If it has spaces like a sentence, it's likely a hallucination
    if (clean.split(' ').length > 3) return false;
    
    // If it's absurdly long
    if (clean.length > 40) return false;
    
    return true;
}

/**
 * Validates the core elements of a Document Extraction.
 * Returns an array of failing fields.
 */
export function validateExtraction(data: any, isDrawing: boolean = false): string[] {
    const failures: string[] = [];

    // All documents need a Document Number
    if (!isValidDocumentNumber(data.documentNumber)) {
        failures.push('documentNumber');
    }

    // Drawings almost always require a Revision
    if (isDrawing && !isValidRevision(data.revision)) {
        failures.push('revision');
    }

    // Title sanity check
    if (!data.title || data.title.trim().length < 3 || data.title.length > 150) {
        failures.push('title');
    }

    return failures;
}
