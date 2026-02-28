
require('dotenv').config();
import { query } from './src/db';
import { getUser, incrementUsage, decrementUsage } from './src/services/userService';

async function verifyFix() {
    try {
        const userId = 'user_test_verify_fix';

        // 1. Setup - Ensure user exists
        await query(`INSERT INTO users (id, email, subscription_tier, documents_usage, documents_limit) 
                     VALUES ($1, $2, 'free', 0, 10) 
                     ON CONFLICT (id) DO UPDATE SET documents_usage = 0`,
            [userId, 'test@example.com']);

        console.log('✅ Test user reset. Usage: 0');

        // 2. Insert dummy documents (Simulate upload)
        const transmittalTitle = 'Transmittal_Fix_Test';
        await query(
            `INSERT INTO documents (user_id, filename, excerpt_data, title) VALUES 
            ($1, 'doc1.pdf', $2, 'Doc 1'),
            ($1, 'doc2.pdf', $2, 'Doc 2')`,
            [userId, JSON.stringify({ transmittalTitle })]
        );

        // Manually increment usage to match (simulating the api logic)
        await incrementUsage(userId);
        await incrementUsage(userId);

        const userAfterUpload = await getUser(userId);
        console.log(`✅ Uploaded 2 docs. Usage should be 2. Actual: ${userAfterUpload?.documents_usage}`);

        // 3. Perform Delete via API Logic Simulation (Testing the Query)
        console.log('Testing Delete Query...');
        const deleteRes = await query(
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
            await query(
                `UPDATE users 
                 SET documents_usage = GREATEST(0, documents_usage - $1),
                     updated_at = NOW()
                 WHERE id = $2`,
                [deleteRes.rowCount, userId]
            );
        }

        // 5. Verify Final State
        const userFinal = await getUser(userId);
        console.log(`✅ Final Usage should be 0. Actual: ${userFinal?.documents_usage}`);

        const remainingDocs = await query('SELECT * FROM documents WHERE user_id = $1', [userId]);
        console.log(`✅ Remaining docs should be 0. Actual: ${remainingDocs.rowCount}`);

        if (userFinal?.documents_usage === 0 && remainingDocs.rowCount === 0) {
            console.log('🎉 VERIFICATION SUCCESSFUL!');
        } else {
            console.log('❌ VERIFICATION FAILED');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

verifyFix();
