import { query } from './src/db';

async function checkArticles() {
    try {
        const res = await query('SELECT * FROM articles');
        console.log('--- Articles in DB (Full) ---');
        console.table(res.rows);
        console.log('Total:', res.rowCount);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        process.exit();
    }
}

checkArticles();
