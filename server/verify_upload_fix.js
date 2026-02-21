const fs = require('fs');
const path = require('path');

async function testUpload() {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filePath = path.join(__dirname, 'valid_test.pdf');
    const fileBuffer = fs.readFileSync(filePath);

    // Construct payload manually (Multipart format)
    const body = Buffer.concat([
        Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="userId"\r\n\r\n` +
            `user_39g1NzSpQVvxuWZCrYbMjdXZBt4\r\n` +
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="transmittalTitle"\r\n\r\n` +
            `VERIFY_FIX_TITLE\r\n` +
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="valid_test.pdf"\r\n` +
            `Content-Type: application/pdf\r\n\r\n`
        ),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    try {
        console.log('Sending upload request with PDF...');
        const res = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: body
        });

        if (res.ok) {
            const json = await res.json();
            console.log('Upload Success!');
            console.log('Returned Data:', JSON.stringify(json, null, 2));
        } else {
            console.log('Upload Failed:', res.status, await res.text());
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

testUpload();
