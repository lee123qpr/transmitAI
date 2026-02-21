import { query } from './src/db';
import fs from 'fs';
import path from 'path';

async function migrate() {
    try {
        const migrationsDir = path.join(__dirname, 'src/db/migrations');
        const files = fs.readdirSync(migrationsDir).sort();

        console.log('Available migrations:', files);

        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`Applying migration: ${file}...`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                await query(sql);
                console.log(`Success: ${file}`);
            }
        }

        console.log('All migrations checked/applied.');
        process.exit(0);
    } catch (err) {
        console.error('Migration Master Failure:', err);
        process.exit(1);
    }
}

migrate();
