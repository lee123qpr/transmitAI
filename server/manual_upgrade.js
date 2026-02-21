
const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_tZqGpnf8z5Ym@ep-floral-sun-ab6ip92h-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function upgrade() {
    await client.connect();
    const res = await client.query(`
    UPDATE users 
    SET subscription_tier = 'pro', documents_limit = 100 
    WHERE email = 'leekilcoyne1@gmail.com' 
    RETURNING *;
  `);
    console.log('Result:', JSON.stringify(res.rows, null, 2));
    await client.end();
}

upgrade().catch(console.error);
