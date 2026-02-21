
import { query } from './db';

const debugUser = async () => {
    try {
        console.log('--- USER STATUS ---');
        // Replace with the specific userId seen in the logs/curl
        const userId = 'user_39g1NzSpQVvxuWZCrYbMjdXZBt4';
        const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
        console.log(userRes.rows[0]);

        console.log('--- LATEST DOCUMENT ---');
        const docRes = await query('SELECT id, title, excerpt_data FROM documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
        const doc = docRes.rows[0];
        if (doc) {
            console.log('ID:', doc.id);
            console.log('Raw Excerpt:', doc.excerpt_data);
            let parsed = doc.excerpt_data;
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            console.log('Parsed TransmittalTitle:', parsed?.transmittalTitle);
        }
    } catch (err) {
        console.error(err);
    }
    process.exit();
};

debugUser();
