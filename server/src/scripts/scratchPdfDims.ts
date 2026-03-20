import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

async function run() {
    console.log('Testing sharp dimension extraction...');
    
    // Workaround for TypeScript converting dynamic import to require() in CommonJS
    const { pdf: pdfImg } = await Function('return import("pdf-to-img")')();
    
    const TEST_DIR = path.join(__dirname, '../../../test-files');
    // Using an actual drawing to test dimensions
    const testPdf = path.join(TEST_DIR, '1132-01-P2-Site Plan (NORTH) - Blocks ABC - Houses.pdf');
    
    const fileBuffer = fs.readFileSync(testPdf);
    const pdfBase64 = fileBuffer.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    try {
        const document = await pdfImg(pdfDataUrl, { scale: 1.0 });
        console.log(`Document loaded. Total pages: ${document.length}`);
        
        for await (const page of document) {
            const metadata = await sharp(page).metadata();
            console.log(`Page dimensions: ${metadata.width}x${metadata.height}`);
            console.log(`Is Landscape? ${metadata.width! > metadata.height!}`);
            
            // Try cropping bottom-right 25%
            if (metadata.width && metadata.height) {
                const cropWidth = Math.floor(metadata.width * 0.25);
                const cropHeight = Math.floor(metadata.height * 0.25);
                const left = metadata.width - cropWidth;
                const top = metadata.height - cropHeight;
                
                const croppedBuffer = await sharp(page)
                    .extract({ left, top, width: cropWidth, height: cropHeight })
                    .toBuffer();
                    
                console.log(`Cropped Buffer size: ${(croppedBuffer.length / 1024).toFixed(1)} KB`);
                
                // Save it to inspect manually
                const outPath = path.join(__dirname, 'test_crop.png');
                fs.writeFileSync(outPath, croppedBuffer);
                console.log(`Saved crop to ${outPath}`);
            }
            break; 
        }

    } catch (e) {
        console.error(e);
    }
}
run();
