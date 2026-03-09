import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon
    },
    max: 20, // Max number of connections per serverless instance
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 5000, // Fail fast if DB is unreachable
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
