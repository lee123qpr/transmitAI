import { query } from './src/db';
import * as fs from 'fs';

async function updateLinks() {
    try {
        console.log('Fetching live email templates...');
        const res = await query('SELECT key, value FROM system_settings WHERE key IN ($1, $2)', ['email_template_user_welcome', 'email_template_newsletter']);

        for (const row of res.rows) {
            let templateObj = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;

            if (templateObj && templateObj.html) {
                // Replace all instances of transmit.ai with www.transmittal.co.uk
                templateObj.html = templateObj.html.replace(/https:\/\/transmit\.ai/g, 'https://www.transmittal.co.uk');

                // Replace the specific logo path with the favicon
                templateObj.html = templateObj.html.replace(/https:\/\/www\.transmittal\.co\.uk\/logo\.png/g, 'https://www.transmittal.co.uk/favicon.ico');

                await query('UPDATE system_settings SET value = $1 WHERE key = $2', [JSON.stringify(templateObj), row.key]);
                console.log(`Updated HTML template for ${row.key}`);
            }
        }
        console.log('Update complete!');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

updateLinks();
