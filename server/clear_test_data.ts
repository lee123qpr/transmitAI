import { query } from './src/db';

async function clear() {
    try {
        await query("DELETE FROM documents WHERE user_id = 'test_user_123'");
        await query("UPDATE users SET documents_usage = 0 WHERE id = 'test_user_123'");
        console.log('Test data cleared successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Failed to clear test data', e);
        process.exit(1);
    }
}

clear();
