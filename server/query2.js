const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query("SELECT * FROM documents WHERE excerpt_data::text LIKE '%24/02/2026, 20:47:40%' LIMIT 3").then(res => {
    const documents = res.rows.map(doc => {
        let excerpt = doc.excerpt_data;
        if (typeof excerpt === 'string') {
            try { excerpt = JSON.parse(excerpt); } catch (e) { excerpt = {}; }
        }

        console.log('---');
        console.log('RAW EXCERPT:', JSON.stringify(excerpt).substring(0, 150));
        console.log('EXCERPT CONFIDENCE_SCORE:', excerpt?.confidence_score);

        return {
            id: doc.id,
            filename: doc.filename,
            confidence_score: excerpt?.confidence_score,
        };
    });
    console.log('FINAL MAPPED DOCS:', documents);
    pool.end();
}).catch(console.error);
