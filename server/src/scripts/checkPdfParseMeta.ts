import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

async function run() {
    const testPdf = path.join(__dirname, '../../../test-files/1132-01-P2-Site Plan (NORTH) - Blocks ABC - Houses.pdf');
    const fileBuffer = fs.readFileSync(testPdf);
    const pdfData = await pdfParse(fileBuffer);
    
    console.log("Pages:", pdfData.numpages);
    console.log("Info:", pdfData.info);
    console.log("Metadata:", pdfData.metadata);
    console.log("Text length:", pdfData.text.length);
    console.log("chars/kb:", pdfData.text.length / (fileBuffer.length / 1024));
}
run();
