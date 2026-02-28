const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query("SELECT COUNT(*) FROM documents WHERE user_id = 'user_39zdtD99DfbFptGBHucdll1CTuy'").then(res => {
    console.log('User 39z count:', res.rows[0]);
    pool.end();
}).catch(console.error);
