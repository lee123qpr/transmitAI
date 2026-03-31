import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function run() {
    const pdfParse = require('pdf-parse');
    const file = process.argv[2] || '01.pdf';
    const filePath = path.join(__dirname, '../../../test-files', file);
    const buf = fs.readFileSync(filePath);
    const data = await pdfParse(buf);
    console.log(`=== TEXT EXTRACTED FROM ${file} ===`);
    console.log(`Length: ${data.text.length} chars`);
    console.log(`\nRaw text:\n${data.text.substring(0, 2000)}`);
}
run().catch(console.error);
