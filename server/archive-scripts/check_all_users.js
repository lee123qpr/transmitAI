// Quick check to see what's been logged recently
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAllUsers() {
    try {
        const result = await pool.query(
            'SELECT id, email, subscription_tier, documents_usage, documents_limit FROM users ORDER BY created_at DESC LIMIT 5'
        );

        console.log('\n📋 Recent Users:');
        console.log('═══════════════════════════════════════════════════════════════════');
        result.rows.forEach((user, idx) => {
            console.log(`${idx + 1}. ${user.email}`);
            console.log(`   User ID:  ${user.id}`);
            console.log(`   Tier:     ${user.subscription_tier.toUpperCase()}`);
            console.log(`   Usage:    ${user.documents_usage}/${user.documents_limit}`);
            console.log('───────────────────────────────────────────────────────────────────');
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkAllUsers();
