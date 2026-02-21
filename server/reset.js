require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        await client.connect();
        const res = await client.query(`
            UPDATE users 
            SET documents_limit = CASE 
                WHEN subscription_tier = 'pro' THEN 100 
                ELSE 10 
            END
            RETURNING *
        `);
        console.log("Reset limits for", res.rowCount, "users.");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
