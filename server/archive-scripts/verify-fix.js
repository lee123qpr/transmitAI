
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function verifyFix() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const userId = 'user_test_verify_fix_js';

        // 1. Setup - Ensure user exists
        await client.query(`INSERT INTO users (id, email, subscription_tier, documents_usage, documents_limit) 
                     VALUES ($1, $2, 'free', 0, 10) 
                     ON CONFLICT (id) DO UPDATE SET documents_usage = 0`,
            [userId, 'test@example.com']);

        console.log('✅ Test user reset. Usage: 0');

        // 2. Insert dummy documents (Simulate upload)
        const transmittalTitle = 'Transmittal_Fix_Test_JS';
        await client.query(
            `INSERT INTO documents (user_id, filename, excerpt_data, title) VALUES 
            ($1, 'doc1.pdf', $2, 'Doc 1'),
            ($1, 'doc2.pdf', $2, 'Doc 2')`,
            [userId, JSON.stringify({ transmittalTitle })]
        );

        // Manually update usage to 2
        await client.query('UPDATE users SET documents_usage = 2 WHERE id = $1', [userId]);

        const resUser = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        console.log(`✅ Uploaded 2 docs. Usage should be 2. Actual: ${resUser.rows[0].documents_usage}`);

        // 3. Perform Delete via API Logic Simulation (Testing the Query)
        console.log('Testing Delete Query...');
        const deleteRes = await client.query(
            `DELETE FROM documents 
             WHERE user_id = $1 
             AND (
                excerpt_data->>'transmittalTitle' = $2 
                OR title = $2
             ) RETURNING id`,
            [userId, transmittalTitle]
        );

        console.log(`Deleted rows: ${deleteRes.rowCount}`);

        // 4. Update Usage (Simulating API call to decrement)
        if (deleteRes.rowCount > 0) {
            await client.query(
                `UPDATE users 
                 SET documents_usage = GREATEST(0, documents_usage - $1),
                     updated_at = NOW()
                 WHERE id = $2`,
                [deleteRes.rowCount, userId]
            );
        }

        // 5. Verify Final State
        const userFinal = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        console.log(`✅ Final Usage should be 0. Actual: ${userFinal.rows[0].documents_usage}`);

        const remainingDocs = await client.query('SELECT * FROM documents WHERE user_id = $1', [userId]);
        console.log(`✅ Remaining docs should be 0. Actual: ${remainingDocs.rowCount}`);

        if (userFinal.rows[0].documents_usage === 0 && remainingDocs.rowCount === 0) {
            console.log('🎉 VERIFICATION SUCCESSFUL!');
        } else {
            console.log('❌ VERIFICATION FAILED');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

verifyFix();
