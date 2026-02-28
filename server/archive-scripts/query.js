const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const query = `
  SELECT user_id, filename, excerpt_data, created_at 
  FROM documents 
  WHERE excerpt_data::text LIKE '%24/02/2026, 20:47:40%'
  ORDER BY created_at DESC
`;

pool.query(query).then(res => {
    res.rows.forEach(r => {
        let excerpt = r.excerpt_data;
        if (typeof excerpt === 'string') {
            try { excerpt = JSON.parse(excerpt); } catch (e) { }
        }
        console.log('User:', r.user_id, 'File:', r.filename);
        console.log('Score:', excerpt?.confidence_score);
        console.log('Keys:', Object.keys(excerpt || {}).join(', '));
    });
    console.log('Total found:', res.rows.length);
    pool.end();
}).catch(console.error);
