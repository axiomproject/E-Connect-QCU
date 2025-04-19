"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const env_1 = require("./env");
// Use DATABASE_URL if available, otherwise use individual connection parameters
exports.pool = new pg_1.Pool(env_1.env.DATABASE_URL
    ? {
        connectionString: env_1.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Often needed for Render's external connections
    }
    : {
        host: env_1.env.DB_HOST || 'localhost',
        port: env_1.env.DB_PORT ? parseInt(env_1.env.DB_PORT) : 5432,
        database: env_1.env.DB_NAME || 'econnect',
        user: env_1.env.DB_USER,
        password: env_1.env.DB_PASSWORD
    });
// Test the connection
exports.pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    }
    else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});
