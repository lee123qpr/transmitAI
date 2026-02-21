const fs = require('fs');
const http = require('http');
const path = require('path');

// Constants
const HOST = 'localhost';
const PORT = 3000;
const USER_ID = 'test-user-' + Date.now(); // Unique user for this test run

// Helpers
const createDummyPDF = (filename, content = 'Dummy PDF Content') => {
    // Create a minimal valid PDF structure so it doesn't fail basic parsing if we don't want it to
    // But for the "Corrupt" test we want it to fail.
    // Let's make a simple text file pretending to be PDF
    fs.writeFileSync(filename, content);
    console.log(`Created dummy file: ${filename}`);
};

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const uploadFile = (filename, isCorrupt = false) => {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filename);

        const postDataStart = [
            `--${boundary}`,
            `Content-Disposition: form-data; name="userId"`,
            '',
            USER_ID,
            `--${boundary}`,
            `Content-Disposition: form-data; name="email"`,
            '',
            'test@example.com',
            `--${boundary}`,
            `Content-Disposition: form-data; name="file"; filename="${filename}"`,
            `Content-Type: application/pdf`,
            '',
            ''
        ].join('\r\n');

        const postDataEnd = `\r\n--${boundary}--`;

        const options = {
            hostname: HOST,
            port: PORT,
            path: '/api/upload',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(postDataStart) + fileContent.length + Buffer.byteLength(postDataEnd)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        req.write(postDataStart);
        req.write(fileContent);
        req.write(postDataEnd);
        req.end();
    });
};

const runTests = async () => {
    console.log('--- Starting Upload Verification ---');

    // 1. Create a "Valid" dummy PDF (It won't be a real PDF, so AI might fail, but let's see if 
    //    our "corrupt" check is too strict or if it allows text-as-pdf. 
    //    Actually, our AI service checks for PDF header. 
    //    So a text file named .pdf WILL fail as corrupt/invalid format.
    //    For the "Duplicate" test, we need something that passes extraction or at least gets to the hash check.
    //    The hash check happens BEFORE extraction in my code! So any file content is fine for duplicate test.

    const validFilename = 'test_valid.pdf';
    createDummyPDF(validFilename, '%PDF-1.4\n%µµµµ\nDummy Content for Hash Test');

    // Test 1: First Upload (Should 200 or 400/422 if extraction fails, but NOT 409)
    // Wait, if it fails extraction (400), it might not save? 
    // Code: Hash Check -> Extraction (Try/Catch) -> Insert.
    // If extraction fails, we return 400/422 and DO NOT INSERT.
    // So to test duplicates, we need a file that PASSES extraction.
    // I don't have a real PDF generator here.
    // BUT, I can simulate a text file upload! .txt is supported.

    const txtFilename = 'test_duplicate.txt';
    createDummyPDF(txtFilename, 'This is a valid text file content for duplication test.');

    console.log('\n--- Test 1: Initial Upload (TXT) ---');
    const res1 = await uploadFile(txtFilename);
    console.log(`Status: ${res1.status}`); // Expect 200
    console.log('Response:', res1.body.message || res1.body.error);

    if (res1.status === 200) {
        console.log('✅ Initial upload successful.');

        // Test 2: Duplicate Upload
        console.log('\n--- Test 2: Duplicate Upload (TXT) ---');
        const res2 = await uploadFile(txtFilename);
        console.log(`Status: ${res2.status}`); // Expect 409
        console.log('Response:', res2.body.message || res2.body.error);

        if (res2.status === 409) {
            console.log('✅ Duplicate detection verified (409 Conflict).');
        } else {
            console.log('❌ Duplicate detection failed.');
        }
    } else {
        console.log('⚠️ Skipping duplicate test because initial upload failed (likely due to extraction issues).');
    }

    // Test 3: Corrupt PDF
    // A file that claims to be PDF but has random content
    const corruptFilename = 'test_corrupt.pdf';
    createDummyPDF(corruptFilename, 'This is definitely not a PDF');

    console.log('\n--- Test 3: Corrupt PDF Upload ---');
    const res3 = await uploadFile(corruptFilename);
    console.log(`Status: ${res3.status}`); // Expect 400
    console.log('Response:', res3.body.message || res3.body.error);

    if (res3.status === 400 && (res3.body.error === 'File Processing Failed' || res3.body.message.includes('corrupt'))) {
        console.log('✅ Corrupt file handling verified.');
    } else {
        console.log('❌ Corrupt file handling failed or returned unexpected status.');
    }

    // Cleanup
    try {
        fs.unlinkSync(validFilename);
        fs.unlinkSync(txtFilename);
        fs.unlinkSync(corruptFilename);
    } catch (e) { }
};

runTests();
