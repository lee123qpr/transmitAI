import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
// Load .env explicitly for CLI usage BEFORE importing aiService
dotenv.config({ path: path.join(__dirname, '../../.env') });

const TEST_DIR = path.join(__dirname, '../../../test-files');

async function testExtraction() {
    console.log('🤖 Transmittal AI - Local Extraction Harness');
    
    if (!fs.existsSync(TEST_DIR)) {
        console.error(`❌ Test directory not found: ${TEST_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(TEST_DIR);
    if (files.length === 0) {
        console.error('❌ No files found in test directory.');
        process.exit(1);
    }

    console.log(`📂 Found ${files.length} test files. Getting a random file...\n`);
    
    // Accept a target file as a CLI arg, or fall back to a random one
    const arg = process.argv[2];
    const validFiles = files.filter((f: string) => f.match(/\.(pdf|docx|xlsx|txt|csv|dxf|jpg|png)$/i));
    const targetFile = arg || validFiles[Math.floor(Math.random() * validFiles.length)];
    const filePath = path.join(TEST_DIR, targetFile);
    
    console.log(`===============================================`);
    console.log(`📄 Testing: ${targetFile}`);
    console.log(`🚀 File Size: ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`);
    console.log(`===============================================`);

    try {
        const { extractDocumentData } = await import('../services/aiService');
        const fileBuffer = fs.readFileSync(filePath);
        console.time('Extraction Time');
        const data = await extractDocumentData(fileBuffer, targetFile);
        console.timeEnd('Extraction Time');
        
        console.log('\n✅ EXTRACTION SUCCESS:');
        console.dir(data, { depth: null, colors: true });

    } catch (error) {
        console.error('\n❌ EXTRACTION FAILED:');
        console.error(error);
    }
}

testExtraction().catch(console.error);
