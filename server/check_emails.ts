import { query } from './src/db';
import * as fs from 'fs';

async function check() {
    try {
        const res = await query('SELECT key, value FROM system_settings WHERE key IN ($1, $2)', ['email_template_user_welcome', 'email_template_newsletter']);
        fs.writeFileSync('emails_clean.json', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
