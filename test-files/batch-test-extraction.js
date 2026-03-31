const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/documents/upload';

async function testFileExtraction(filename) {
    const filePath = path.join(__dirname, filename);
    const form = new FormData();

    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer]);
    form.append('file', fileBlob, filename);
    form.append('userId', 'test_user_123');
    form.append('transmittalTitle', 'Batch API Test Upload');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: form,
            headers: {
                'Authorization': 'Bearer mock_token'
            }
        });

        const result = await response.json();

        if (response.ok) {
            return { filename, status: 'success', data: result.extractedData };
        } else {
            return { filename, status: 'failed', error: result.error || result.message };
        }
    } catch (error) {
        return { filename, status: 'failed', error: error.message };
    }
}

async function runBatchTests() {
    console.log('\n🧪 Starting AI Batch Extraction Tests\n');
    
    // Get all PDF files from test-files directory
    const files = fs.readdirSync(__dirname).filter(f => f.toLowerCase().endsWith('.pdf') || f.toLowerCase().endsWith('.docx') || f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx'));
    console.log(`Found ${files.length} files to test.`);
    
    // To "test loads of files at the same time" while being respectful of potential rate limits, we'll run them in chunks.
    const CHUNK_SIZE = 5; 
    let results = [];
    
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);
        console.log(`Processing chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(files.length / CHUNK_SIZE)} (${chunk.join(', ')})`);
        
        const promises = chunk.map(file => testFileExtraction(file));
        const chunkResults = await Promise.all(promises);
        results.push(...chunkResults);
        
        if (i + CHUNK_SIZE < files.length) {
            console.log("Waiting 2 seconds to avoid rate limits...");
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
    
    let successes = results.filter(r => r.status === 'success');
    let failures = results.filter(r => r.status === 'failed');
    
    console.log(`Total: ${results.length}`);
    console.log(`Success: ${successes.length}`);
    console.log(`Failed: ${failures.length}\n`);
    
    if (failures.length > 0) {
        console.log("Failed Files:");
        failures.forEach(f => console.log(`- ${f.filename}: ${f.error}`));
    }
    
    // Optionally write full results to a JSON file for analysis
    fs.writeFileSync(path.join(__dirname, 'batch-results.json'), JSON.stringify(results, null, 2));
    console.log('\nFull details saved to batch-results.json');
}

runBatchTests().catch(console.error);
