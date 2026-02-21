
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function uploadFile() {
    try {
        const form = new FormData();
        const filePath = path.join(__dirname, 'test_gen.pdf');

        // Ensure file exists
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '%PDF-1.4\n%Simple PDF for testing');
        }

        form.append('file', fs.createReadStream(filePath));
        form.append('userId', 'test-user-verification');
        form.append('email', 'test@example.com');

        console.log('Sending upload request...');
        const start = Date.now();
        const response = await axios.post('http://localhost:3000/api/upload', form, {
            headers: {
                ...form.getHeaders()
            },
            timeout: 60000 // Client side timeout 60s
        });

        console.log(`Upload successful in ${(Date.now() - start) / 1000}s`);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Upload failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

uploadFile();
