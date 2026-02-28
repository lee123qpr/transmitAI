const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkUserTier() {
    try {
        const email = 'leeking1@live.co.uk';

        const result = await pool.query(
            'SELECT id, email, subscription_tier, documents_usage, documents_limit, created_at FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log(`❌ No user found with email: ${email}`);
        } else {
            const user = result.rows[0];
            console.log('\n✅ User Found:');
            console.log('─────────────────────────────────────');
            console.log(`Email:           ${user.email}`);
            console.log(`Clerk User ID:   ${user.id}`);
            console.log(`Tier:            ${user.subscription_tier.toUpperCase()}`);
            console.log(`Usage:           ${user.documents_usage}/${user.documents_limit}`);
            console.log(`Created:         ${user.created_at}`);
            console.log('─────────────────────────────────────\n');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkUserTier();
