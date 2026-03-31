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
    const text = data.text;

    const allTokens = text.trim().split(/\s+/).filter((t: string) => t.length > 0);
    const alphaTokens = allTokens.filter((t: string) => /[a-zA-Z]/.test(t));
    const singleLetterTokens = allTokens.filter((t: string) => /^[a-zA-Z]$/.test(t));
    const garbledRatio = alphaTokens.length > 5 ? singleLetterTokens.length / alphaTokens.length : 0;

    console.log(`Total tokens: ${allTokens.length}`);
    console.log(`Alpha tokens: ${alphaTokens.length}`);
    console.log(`Single-letter tokens: ${singleLetterTokens.length}`);
    console.log(`Garbled ratio: ${(garbledRatio * 100).toFixed(1)}%`);
    console.log(`Would trigger (>50%): ${garbledRatio > 0.50}`);
    console.log(`\nAlpha tokens list:`, alphaTokens.slice(0, 30));
    console.log(`Single letter tokens:`, singleLetterTokens.slice(0, 30));
}
run().catch(console.error);
