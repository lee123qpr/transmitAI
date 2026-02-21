import { PDFParse } from 'pdf-parse';
import * as fs from 'fs';

async function test() {
    try {
        console.log("Reading valid_test.pdf...");
        const dataBuffer = fs.readFileSync('valid_test.pdf');

        console.log(`Buffer size: ${dataBuffer.length} bytes`);

        console.log("Parsing PDF...");
        const parser = new PDFParse({ data: dataBuffer });
        const data = await parser.getText();
        await parser.destroy();

        console.log("Success!");
        console.log("Text length:", data.text.length);
        console.log("Preview:", data.text.substring(0, 100));

    } catch (error) {
        console.error("Error parsing PDF:", error);
    }
}

test();
