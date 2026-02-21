import { query } from './index';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);
}

async function runMigrations() {
    console.log('Starting migrations...');
    await ensureMigrationTable();

    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
    const appliedRes = await query('SELECT name FROM _migrations');
    const applied = new Set(appliedRes.rows.map(r => r.name));

    for (const file of files) {
        if (!applied.has(file)) {
            console.log(`Applying migration: ${file}...`);
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

            try {
                // Split by semicolon to run multiple statements if needed, 
                // but usually better to run the whole block if possible.
                // However, pg-pool query doesn't like multiple statements in one go if they return results.
                // For direct DDL, it's usually fine.
                await query(sql);
                await query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                console.log(`Successfully applied ${file}`);
            } catch (err) {
                console.error(`Error applying ${file}:`, err);
                process.exit(1);
            }
        }
    }
    console.log('Migrations complete.');
    process.exit(0);
}

runMigrations().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
