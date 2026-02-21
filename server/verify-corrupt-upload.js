const fs = require('fs');

async function runTest() {
    const userId = 'test-user-corrupt-check';
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

    // Helper to create multipart body
    const createBody = (filename, fileContent) => {
        let body = '';
        // User ID & Email
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="userId"\r\n\r\n`;
        body += `${userId}\r\n`;
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="email"\r\n\r\n`;
        body += `test@example.com\r\n`;

        // Transmittal Title
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="transmittalTitle"\r\n\r\n`;
        body += `Corrupt Test Batch\r\n`;

        // File (claiming to be PDF but is just garbage test)
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
        body += `Content-Type: application/pdf\r\n\r\n`; // Claim it's PDF
        body += `${fileContent}\r\n`; // But content is garbage text

        body += `--${boundary}--\r\n`;
        return body;
    };

    const upload = async (filename) => {
        console.log(`\nUploading ${filename} (Corrupt Content)...`);
        try {
            const body = createBody(filename, 'THIS IS NOT A VALID PDF FILE CONTENT %PDF-1.4 but truncated and garbage...');
            const res = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                },
                body: body
            });

            const data = await res.json();

            if (res.status === 400 && (data.error === 'File Processing Failed' || data.message?.includes('corrupt'))) {
                console.log(`✅ Correctly caught corrupt file: ${data.message}`);
            } else if (res.status === 200) {
                console.error(`❌ FAILED: File was accepted but should have been rejected as key extraction failed.`);
                console.log('Response:', data);
            } else {
                console.log(`⚠️  Unexpected status ${res.status}:`, data);
            }
        } catch (err) {
            console.error('Request failed:', err.message);
        }
    };

    console.log('--- Starting Corrupt File Test ---');
    await upload('corrupt_file.pdf');
}

runTest();
