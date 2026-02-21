import 'dotenv/config';
import pool from './src/db/index';

async function resetDatabase() {
    const client = await pool.connect();
    const adminEmail = 'leekilcoyne1@gmail.com';

    try {
        console.log('Starting cautious database wipe...');

        // Get the admin user ID so we can preserve it
        const adminRes = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

        if (adminRes.rows.length === 0) {
            console.warn(`Admin user ${adminEmail} not found. Safe aborting to prevent total data loss.`);
            return;
        }

        const adminId = adminRes.rows[0].id;
        console.log(`Preserving admin user: ${adminId}`);

        // Since we have foreign keys, we'll explicitly delete related records for non-admin users
        // Alternatively, if ON DELETE CASCADE is set, deleting the user is enough.
        // Let's do it manually to be absolutely safe and thorough.

        const safeDelete = async (table: string, userCol = 'user_id') => {
            try {
                await client.query(`DELETE FROM ${table} WHERE ${userCol} != $1`, [adminId]);
                console.log(`Deleted non-admin records from ${table}`);
            } catch (e: any) {
                if (e.code === '42P01') console.log(`Skipped ${table} (does not exist)`);
                else console.error(`Failed on ${table}:`, e.message);
            }
        };

        await safeDelete('extractions');
        await safeDelete('documents');
        await safeDelete('transmittals');
        await safeDelete('subscriptions');
        await safeDelete('api_keys');

        console.log('Deleting all non-admin users...');
        const userDelete = await client.query('DELETE FROM users WHERE id != $1 RETURNING id', [adminId]);
        console.log(`Deleted ${userDelete.rowCount} non-admin users.`);

        console.log('Database successfully reset to a blank slate! (Admin preserved)');

    } catch (error) {
        console.error('Error during database reset:', error);
    } finally {
        client.release();
        pool.end();
    }
}

resetDatabase();
