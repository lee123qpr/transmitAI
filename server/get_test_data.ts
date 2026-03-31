import { query } from 'c:/Users/Lee Kilcoyne/OneDrive/Desktop/Transmittal/server/src/db';
import fs from 'fs';

async function run() {
    const res = await query("SELECT filename, excerpt_data FROM documents WHERE user_id = 'test_user_123' ORDER BY created_at DESC LIMIT 100");
    
    let md = '# Extracted Data for test_user_123\n\n';
    
    for (const row of res.rows) {
        md += `## ${row.filename}\n`;
        md += '```json\n';
        if (typeof row.excerpt_data === 'string') {
            try {
                md += JSON.stringify(JSON.parse(row.excerpt_data), null, 2);
            } catch (e) { md += row.excerpt_data; }
        } else {
             md += JSON.stringify(row.excerpt_data, null, 2);
        }
        md += '\n```\n\n';
    }
    
    fs.writeFileSync('C:/Users/Lee Kilcoyne/.gemini/antigravity/brain/6074814a-f443-42c4-b2bb-ad9bc7531bd7/artifacts/extracted_data.md', md);
    console.log(`Wrote ${res.rows.length} rows to artifact.`);
    process.exit(0);
}

run().catch(console.error);
