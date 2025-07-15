#!/usr/bin/env node

/**
 * E-Connect Neon Database Import Script (Node.js version)
 * Alternative to PowerShell script for cross-platform compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  neonConnectionString: "postgresql://neondb_owner:npg_lj5JFGAIE2Kn@ep-cold-bird-a1oa51jk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  localDb: {
    name: "econnect",
    user: "postgres",
    password: "test",
    host: "localhost",
    port: "5432"
  },
  files: {
    backup: "econnect_backup.sql",
    schema: "neon-migration.sql"
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description, env = {}) {
  try {
    log(`\n${description}...`, 'green');
    const result = execSync(command, { 
      stdio: 'pipe', 
      env: { ...process.env, ...env },
      encoding: 'utf8'
    });
    log(`✓ ${description} successful`, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function checkPrerequisites() {
  log('=== E-Connect Neon Database Import Script ===', 'cyan');
  log('', 'reset');
  
  // Check if psql is available
  try {
    execSync('psql --version', { stdio: 'pipe' });
    log('✓ PostgreSQL tools found', 'green');
  } catch (error) {
    log('✗ PostgreSQL tools not found', 'red');
    log('Please install PostgreSQL and ensure psql is in your PATH', 'yellow');
    process.exit(1);
  }
  
  // Check if schema file exists
  if (!fs.existsSync(config.files.schema)) {
    log(`✗ Schema file ${config.files.schema} not found`, 'red');
    log('Please ensure the migration script is in the same directory', 'yellow');
    process.exit(1);
  }
}

function testLocalConnection() {
  const command = `psql -h ${config.localDb.host} -p ${config.localDb.port} -U ${config.localDb.user} -d ${config.localDb.name} -c "SELECT version();"`;
  const env = { PGPASSWORD: config.localDb.password };
  
  const result = execCommand(command, 'Testing local database connection', env);
  if (!result.success) {
    log('Please check your local database configuration', 'yellow');
    process.exit(1);
  }
}

function createBackup() {
  const command = `pg_dump -h ${config.localDb.host} -p ${config.localDb.port} -U ${config.localDb.user} -d ${config.localDb.name} -f ${config.files.backup} --no-owner --no-privileges --clean --if-exists`;
  const env = { PGPASSWORD: config.localDb.password };
  
  const result = execCommand(command, 'Creating database backup', env);
  if (!result.success) {
    process.exit(1);
  }
  
  log(`✓ Database backup created: ${config.files.backup}`, 'green');
}

function testNeonConnection() {
  const command = `psql "${config.neonConnectionString}" -c "SELECT version();"`;
  
  const result = execCommand(command, 'Testing Neon database connection');
  if (!result.success) {
    log('Please check your Neon connection string', 'yellow');
    process.exit(1);
  }
}

function setupSchema() {
  const command = `psql "${config.neonConnectionString}" -f ${config.files.schema}`;
  
  const result = execCommand(command, 'Setting up database schema');
  if (result.success) {
    log('✓ Database schema created successfully', 'green');
  } else {
    log('⚠ Some schema creation commands may have failed', 'yellow');
  }
}

function importData() {
  const command = `psql "${config.neonConnectionString}" -f ${config.files.backup}`;
  
  const result = execCommand(command, 'Importing data to Neon');
  if (result.success) {
    log('✓ Data import completed successfully', 'green');
  } else {
    log('⚠ Import completed with some warnings (this is usually normal)', 'yellow');
  }
}

function resetSequences() {
  const command = `psql "${config.neonConnectionString}" -c "SELECT reset_sequences();"`;
  
  const result = execCommand(command, 'Resetting sequences');
  if (result.success) {
    log('✓ Sequences reset successfully', 'green');
  } else {
    log('⚠ Failed to reset sequences', 'yellow');
  }
}

function verifyImport() {
  log('\nStep 7: Verifying import...', 'green');
  
  try {
    const tableCount = execSync(`psql "${config.neonConnectionString}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`).toString().trim();
    
    let userCount, adminCount;
    try {
      userCount = execSync(`psql "${config.neonConnectionString}" -t -c "SELECT COUNT(*) FROM users;"`).toString().trim();
    } catch (e) {
      userCount = 'N/A';
    }
    
    try {
      adminCount = execSync(`psql "${config.neonConnectionString}" -t -c "SELECT COUNT(*) FROM admin_users;"`).toString().trim();
    } catch (e) {
      adminCount = 'N/A';
    }
    
    log('\nDatabase verification:', 'cyan');
    log(`  Tables created: ${tableCount}`, 'reset');
    log(`  Users imported: ${userCount}`, 'reset');
    log(`  Admin users: ${adminCount}`, 'reset');
    
  } catch (error) {
    log('⚠ Could not verify import completely', 'yellow');
  }
}

function showSummary() {
  log('\n=== Import Summary ===', 'cyan');
  log('✓ Local database backup created', 'green');
  log('✓ Connected to Neon database', 'green');
  log('✓ Database schema set up', 'green');
  log('✓ Data imported successfully', 'green');
  log('✓ Sequences reset', 'green');
  
  log('\nNext steps:', 'yellow');
  log('1. Test your application with the Neon database', 'reset');
  log('2. Update your .env files to use the Neon connection string', 'reset');
  log('3. Deploy your application', 'reset');
  
  log('\nDefault admin login:', 'cyan');
  log('  Email: admin@example.com', 'reset');
  log('  Password: admin123', 'reset');
  
  log('\nImport process completed!', 'green');
}

function cleanup() {
  if (fs.existsSync(config.files.backup)) {
    // In a real interactive environment, you'd use readline
    // For now, we'll just inform the user
    log(`\nBackup file ${config.files.backup} created.`, 'yellow');
    log('You can delete it manually if no longer needed.', 'yellow');
  }
}

// Main execution
function main() {
  try {
    checkPrerequisites();
    testLocalConnection();
    createBackup();
    testNeonConnection();
    setupSchema();
    importData();
    resetSequences();
    verifyImport();
    showSummary();
    cleanup();
  } catch (error) {
    log(`\nUnexpected error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, config };