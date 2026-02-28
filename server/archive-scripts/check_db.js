
const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_tZqGpnf8z5Ym@ep-floral-sun-ab6ip92h-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function check() {
    await client.connect();
    const res = await client.query("SELECT email, subscription_tier, documents_limit, status FROM users WHERE email = 'leekilcoyne1@gmail.com';");
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}

check().catch(console.error);
