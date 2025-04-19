import { Pool } from 'pg';
import { env } from './env';
// Use DATABASE_URL if available, otherwise use individual connection parameters
export const pool = new Pool(env.DATABASE_URL
    ? {
        connectionString: env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Often needed for Render's external connections
    }
    : {
        host: env.DB_HOST || 'localhost',
        port: env.DB_PORT ? parseInt(env.DB_PORT) : 5432,
        database: env.DB_NAME || 'econnect',
        user: env.DB_USER,
        password: env.DB_PASSWORD
    });
// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    }
    else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});
