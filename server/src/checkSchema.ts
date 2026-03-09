import { query } from './db';

const run = async () => {
    try {
        const res = await query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'articles' AND column_name = 'header_image'
        `);
        console.log("Column Info:", res.rows[0]);
    } catch (err) {
        console.error("Failed to query database:", err);
    }
    process.exit(0);
}
run();
