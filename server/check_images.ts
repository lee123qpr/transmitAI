import { query } from './src/db';

async function check() {
    try {
        const res = await query('SELECT id, title, header_image FROM articles WHERE header_image IS NOT NULL');
        console.log('ARTICLES WITH IMAGES:');
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
