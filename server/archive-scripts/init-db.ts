import { query } from './src/db';

const initDb = async () => {
    try {
        console.log('Initializing Database...');

        // Users Table
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                subscription_tier TEXT DEFAULT 'free',
                documents_usage INTEGER DEFAULT 0,
                documents_limit INTEGER DEFAULT 10,
                stripe_customer_id TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ Users table ready');

        // Documents Table
        await query(`
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                user_id TEXT REFERENCES users(id) NOT NULL,
                filename TEXT NOT NULL,
                file_size INTEGER,
                file_type TEXT,
                doc_number TEXT,
                revision TEXT,
                title TEXT,
                status TEXT DEFAULT 'Pending',
                issue_date TEXT,
                excerpt_data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ Documents table ready');

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to initialize DB:', err);
        process.exit(1);
    }
};

initDb();
