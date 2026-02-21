
import { query } from '../db';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from server directory
import { join } from 'path';
dotenv.config({ path: join(process.cwd(), '.env') });

async function debugUsers() {
    console.log('--- DEBUGGING USERS TABLE ---');
    try {
        const res = await query('SELECT * FROM users');
        console.log('User Count:', res.rowCount);
        console.log(JSON.stringify(res.rows, null, 2));

        if (res.rows.length === 0) {
            console.log('⚠️  No users found in database!');
        }
    } catch (err) {
        console.error('Database Error:', err);
    }
    process.exit();
}

debugUsers();
