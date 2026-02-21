const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api/upload';
const TEST_FILES = [
    'sample_drawing_register.txt',
    'drawing_register.csv',
    'electrical_diagram.dxf'
];

async function testFileExtraction(filename) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${filename}`);
    console.log('='.repeat(60));

    const filePath = path.join(__dirname, filename);
    const form = new FormData();

    form.append('file', fs.createReadStream(filePath));
    form.append('userId', 'test_user_123');
    form.append('transmittalTitle', 'API Test Upload');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: form,
            headers: {
                ...form.getHeaders(),
                'Authorization': 'Bearer mock_token'
            }
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Upload successful!');
            console.log('\n📋 Extracted Metadata:');
            console.log('  Document Number:', result.extractedData?.documentNumber || 'NOT FOUND');
            console.log('  Revision:', result.extractedData?.revision || 'NOT FOUND');
            console.log('  Title:', result.extractedData?.title || 'NOT FOUND');
            console.log('  Issue Date:', result.extractedData?.issueDate || 'NOT FOUND');
            console.log('  Discipline:', result.extractedData?.discipline || 'NOT FOUND');
            console.log('  Consultant:', result.extractedData?.consultant || 'NOT FOUND');
            console.log('  Status:', result.extractedData?.status || 'NOT FOUND');
            console.log('  Document Type:', result.extractedData?.documentType || 'NOT FOUND');
            console.log('  Summary:', result.extractedData?.summary || 'NOT FOUND');
        } else {
            console.log('❌ Upload failed!');
            console.log('Error:', result.error || result.message);
        }
    } catch (error) {
        console.log('❌ Request failed!');
        console.log('Error:', error.message);
    }
}

async function runAllTests() {
    console.log('\n🧪 Starting AI Extraction Tests for All File Types\n');

    for (const file of TEST_FILES) {
        await testFileExtraction(file);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay between tests
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
}

runAllTests().catch(console.error);
