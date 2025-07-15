#!/usr/bin/env node

/**
 * E-Connect Database Health Check Script
 * Verifies database connection and schema integrity
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Please check your .env file in the backend directory.');
    process.exit(1);
}

// Expected tables in the database
const EXPECTED_TABLES = [
    'users',
    'admin_users',
    'email_verification',
    'password_reset_tokens',
    'donations',
    'user_notifications',
    'admin_notifications',
    'user_goals',
    'goal_activities',
    'ad_clicks',
    'contact_messages'
];

// Expected functions
const EXPECTED_FUNCTIONS = [
    'reset_sequences',
    'update_updated_at_column'
];

async function checkDatabase() {
    const client = new Client({ connectionString: DATABASE_URL });
    
    try {
        console.log('🔍 E-Connect Database Health Check');
        console.log('=====================================\n');
        
        // Test connection
        console.log('📡 Testing database connection...');
        await client.connect();
        console.log('✅ Database connection successful\n');
        
        // Check PostgreSQL version
        const versionResult = await client.query('SELECT version()');
        console.log('🐘 PostgreSQL Version:');
        console.log(`   ${versionResult.rows[0].version}\n`);
        
        // Check database name
        const dbResult = await client.query('SELECT current_database()');
        console.log('🗄️  Current Database:');
        console.log(`   ${dbResult.rows[0].current_database}\n`);
        
        // Check tables
        console.log('📋 Checking tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        const existingTables = tablesResult.rows.map(row => row.table_name);
        
        let allTablesExist = true;
        for (const table of EXPECTED_TABLES) {
            if (existingTables.includes(table)) {
                console.log(`   ✅ ${table}`);
            } else {
                console.log(`   ❌ ${table} (missing)`);
                allTablesExist = false;
            }
        }
        
        // Show unexpected tables
        const unexpectedTables = existingTables.filter(table => !EXPECTED_TABLES.includes(table));
        if (unexpectedTables.length > 0) {
            console.log('\n   📝 Additional tables found:');
            unexpectedTables.forEach(table => {
                console.log(`   ℹ️  ${table}`);
            });
        }
        
        console.log('');
        
        // Check functions
        console.log('⚙️  Checking functions...');
        const functionsResult = await client.query(`
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_type = 'FUNCTION'
            ORDER BY routine_name
        `);
        
        const existingFunctions = functionsResult.rows.map(row => row.routine_name);
        
        let allFunctionsExist = true;
        for (const func of EXPECTED_FUNCTIONS) {
            if (existingFunctions.includes(func)) {
                console.log(`   ✅ ${func}()`);
            } else {
                console.log(`   ❌ ${func}() (missing)`);
                allFunctionsExist = false;
            }
        }
        
        console.log('');
        
        // Check data counts
        console.log('📊 Data summary...');
        
        for (const table of EXPECTED_TABLES) {
            if (existingTables.includes(table)) {
                try {
                    const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
                    const count = parseInt(countResult.rows[0].count);
                    console.log(`   ${table}: ${count} records`);
                } catch (error) {
                    console.log(`   ${table}: Error reading (${error.message})`);
                }
            }
        }
        
        console.log('');
        
        // Check admin users
        if (existingTables.includes('admin_users')) {
            console.log('👤 Admin users...');
            try {
                const adminResult = await client.query(`
                    SELECT username, email, admin_level, is_active, created_at 
                    FROM admin_users 
                    ORDER BY created_at
                `);
                
                if (adminResult.rows.length === 0) {
                    console.log('   ⚠️  No admin users found');
                } else {
                    adminResult.rows.forEach(admin => {
                        const status = admin.is_active ? '✅' : '❌';
                        console.log(`   ${status} ${admin.username} (${admin.email}) - Level ${admin.admin_level}`);
                    });
                }
            } catch (error) {
                console.log(`   ❌ Error checking admin users: ${error.message}`);
            }
            console.log('');
        }
        
        // Check indexes
        console.log('🔍 Checking indexes...');
        const indexResult = await client.query(`
            SELECT 
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        `);
        
        const indexCount = indexResult.rows.length;
        console.log(`   Found ${indexCount} indexes`);
        
        // Group by table
        const indexesByTable = {};
        indexResult.rows.forEach(row => {
            if (!indexesByTable[row.tablename]) {
                indexesByTable[row.tablename] = [];
            }
            indexesByTable[row.tablename].push(row.indexname);
        });
        
        Object.keys(indexesByTable).forEach(table => {
            console.log(`   ${table}: ${indexesByTable[table].length} indexes`);
        });
        
        console.log('');
        
        // Overall health summary
        console.log('🏥 Health Summary');
        console.log('================');
        
        if (allTablesExist) {
            console.log('✅ All expected tables exist');
        } else {
            console.log('❌ Some tables are missing');
        }
        
        if (allFunctionsExist) {
            console.log('✅ All expected functions exist');
        } else {
            console.log('❌ Some functions are missing');
        }
        
        console.log(`✅ Database has ${existingTables.length} tables`);
        console.log(`✅ Database has ${indexCount} indexes`);
        
        if (allTablesExist && allFunctionsExist) {
            console.log('\n🎉 Database is healthy and ready to use!');
        } else {
            console.log('\n⚠️  Database setup may be incomplete.');
            console.log('   Consider running the migration script: npm run import-to-neon');
        }
        
    } catch (error) {
        console.error('❌ Database check failed:');
        console.error(`   ${error.message}`);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting tips:');
            console.log('   - Check if the database server is running');
            console.log('   - Verify the connection string in your .env file');
            console.log('   - Check firewall settings');
        } else if (error.code === '28P01') {
            console.log('\n💡 Authentication failed:');
            console.log('   - Check username and password in connection string');
            console.log('   - Verify database user permissions');
        } else if (error.code === '3D000') {
            console.log('\n💡 Database does not exist:');
            console.log('   - Create the database first');
            console.log('   - Check database name in connection string');
        }
        
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run the check
if (require.main === module) {
    checkDatabase().catch(console.error);
}

module.exports = { checkDatabase };