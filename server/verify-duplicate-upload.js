const fs = require('fs');

async function runTest() {
    const userId = 'test-user-duplicate-check';
    const content = 'This is a test file for duplicate detection ' + Date.now();
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

    // Helper to create multipart body manually (since we might not have form-data package)
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
        body += `Duplicate Test Batch\r\n`;

        // File
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
        body += `Content-Type: text/plain\r\n\r\n`;
        body += `${fileContent}\r\n`;

        body += `--${boundary}--\r\n`;
        return body;
    };

    const upload = async (filename, expectError = false) => {
        console.log(`\nUploading ${filename}...`);
        try {
            const body = createBody(filename, content);
            const res = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                },
                body: body
            });

            const data = await res.json();

            if (res.status === 200) {
                console.log(`✅ Success: ${data.message}`);
                if (expectError) console.error(`❌ FAILED: Expected error but got success.`);
            } else if (res.status === 409) {
                console.log(`✅ Correctly caught duplicate: ${data.error}`);
                if (!expectError) console.error(`❌ FAILED: Expected success but got duplicate error.`);
            } else {
                console.log(`⚠️  Unexpected status ${res.status}:`, data);
            }
        } catch (err) {
            console.error('Request failed:', err.message);
        }
    };

    console.log('--- Starting Duplicate Detection Test ---');

    // 1. First Upload
    await upload('test_duplicate_v1.txt', false);

    // 2. Duplicate Upload (Same Name, Same Content) -> Should Fail
    await upload('test_duplicate_v1.txt', true);

    // 3. Renamed Upload (Different Name, Same Content) -> Should Succeed
    await upload('test_duplicate_v2.txt', false);
}

runTest();
