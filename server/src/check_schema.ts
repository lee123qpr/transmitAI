
import { query } from './db';

const checkSchema = async () => {
    try {
        console.log('Checking USERS table schema...');
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    }
    process.exit();
};

checkSchema();
