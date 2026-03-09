import { query } from './src/db';

async function check() {
    try {
        const res = await query('SELECT key, value FROM system_settings WHERE key IN ($1, $2)', ['email_template_user_welcome', 'email_template_newsletter']);
        console.log("Welcome Template:", res.rows[0].value);
        console.log("Newsletter Template:", res.rows[1].value);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
