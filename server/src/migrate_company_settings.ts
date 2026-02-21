
import { query } from './db';

const migrate = async () => {
    try {
        console.log('Migrating USERS table...');

        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;`);
        console.log('Added company_name column.');

        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_logo_url TEXT;`);
        console.log('Added company_logo_url column.');

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
    process.exit();
};

migrate();
