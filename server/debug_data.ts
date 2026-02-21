
import { query } from './src/db';

const inspect = async () => {
    try {
        console.log('Inspecting documents...');
        const res = await query('SELECT id, excerpt_data FROM documents LIMIT 5');

        res.rows.forEach(row => {
            console.log(`\nID: ${row.id}`);
            console.log('Type of excerpt_data:', typeof row.excerpt_data);
            console.log('Raw Value:', JSON.stringify(row.excerpt_data));

            if (typeof row.excerpt_data === 'string') {
                console.log('⚠️ WARNING: Data is stored as a STRING, not JSON object.');
                // Try to parse it to see if it's double-serialized
                try {
                    const parsed = JSON.parse(row.excerpt_data);
                    console.log('Parsed content:', parsed);

                    if (typeof parsed === 'string') {
                        console.log('🚨 CRITICAL: Triple serialization detected?');
                    }
                } catch (e) {
                    console.log('Could not parse string content.');
                }
            } else {
                console.log('✅ Data appears to be a proper Object/JSON.');
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspect();
