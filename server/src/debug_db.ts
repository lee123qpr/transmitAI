
import { query } from './db';

const debugDocs = async () => {
    try {
        console.log('Querying latest 5 documents...');
        const res = await query('SELECT id, title, excerpt_data FROM documents ORDER BY created_at DESC LIMIT 5');

        res.rows.forEach(row => {
            console.log('------------------------------------------------');
            console.log(`ID: ${row.id}`);
            console.log(`Title: ${row.title}`);
            console.log(`Excerpt Data Type: ${typeof row.excerpt_data}`);
            console.log(`Excerpt Data Content:`, row.excerpt_data);

            let data = row.excerpt_data;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { console.log('Parse error'); }
            }
            console.log(`Transmittal Title: ${data?.transmittalTitle}`);
        });
    } catch (err) {
        console.error(err);
    }
    process.exit();
};

debugDocs();
