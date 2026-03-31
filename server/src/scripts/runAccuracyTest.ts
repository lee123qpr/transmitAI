import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
// Load environment variables for OpenAI
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { extractDocumentData } from '../services/aiService';

const TEST_FILES = [
    '1132-01-P2-Site Plan (NORTH) - Blocks ABC - Houses.pdf',
    '60CS-PLP-A-580-02 - Landscape - Long Section.pdf',
    '1132-NBS-Architectural Specification-P1.pdf',
    '8 - Schedule of Works MAG.docx', // let's use docx or xlsx
    '1132 Accomodation Schedule Updated 2017-11-17.xls'
];

async function runTest() {
    const results: any[] = [];
    const TEST_DIR = path.join(__dirname, '../../../../test-files');

    for (const filename of TEST_FILES) {
        console.log(`\n========================================`);
        console.log(`Testing: ${filename}`);
        console.log(`========================================`);
        
        const filePath = path.join(TEST_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            continue;
        }

        const buffer = fs.readFileSync(filePath);
        
        try {
            const start = Date.now();
            const data = await extractDocumentData(buffer, filename);
            const duration = ((Date.now() - start) / 1000).toFixed(1);
            
            console.log(`[Success] Extracted in ${duration}s:`);
            console.log(JSON.stringify(data, null, 2));
            
            results.push({
                filename,
                status: 'Success',
                duration: `${duration}s`,
                extracted: data
            });
        } catch (error: any) {
            console.error(`[Failed] Error extracting ${filename}:`, error.message);
            results.push({
                filename,
                status: 'Failed',
                error: error.message
            });
        }
    }

    // Save report to JSON
    fs.writeFileSync(path.join(__dirname, 'extraction_results.json'), JSON.stringify(results, null, 2));
    console.log(`\nTests complete. Results saved to extraction_results.json`);
}

runTest().catch(console.error);
