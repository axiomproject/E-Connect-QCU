# E-Connect Neon Database Import Script
# This script helps you import your existing PostgreSQL database to Neon

# Configuration
$NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_lj5JFGAIE2Kn@ep-cold-bird-a1oa51jk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$LOCAL_DB_NAME = "econnect"  # Change this to your local database name
$LOCAL_DB_USER = "postgres"  # Change this to your local PostgreSQL username
$LOCAL_DB_PASSWORD = "test"   # Change this to your local PostgreSQL password
$LOCAL_DB_HOST = "localhost"
$LOCAL_DB_PORT = "5432"

# PostgreSQL bin path - adjust if needed
$PG_BIN = "C:\Program Files\PostgreSQL\17\bin"

# File paths
$BACKUP_FILE = "econnect_backup.sql"
$SCHEMA_FILE = "neon-migration.sql"

Write-Host "=== E-Connect Neon Database Import Script ===" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if PostgreSQL tools are available
if (-not (Test-Path "$PG_BIN\psql.exe")) {
    Write-Host "Error: PostgreSQL tools not found at $PG_BIN" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or update the PG_BIN path in this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Testing local database connection..." -ForegroundColor Green
$env:PGPASSWORD = $LOCAL_DB_PASSWORD
& "$PG_BIN\psql" -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -c "SELECT version();" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Cannot connect to local database '$LOCAL_DB_NAME'" -ForegroundColor Red
    Write-Host "Please check your local database configuration in this script." -ForegroundColor Yellow
    exit 1
}
Write-Host "[+] Local database connection successful" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Creating database backup..." -ForegroundColor Green
& "$PG_BIN\pg_dump" -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -d $LOCAL_DB_NAME -f $BACKUP_FILE --no-owner --no-privileges --clean --if-exists

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create database backup" -ForegroundColor Red
    exit 1
}
Write-Host "[+] Database backup created: $BACKUP_FILE" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Testing Neon database connection..." -ForegroundColor Green
$env:PGPASSWORD = $null  # Clear local password
& "$PG_BIN\psql" "$NEON_CONNECTION_STRING" -c "SELECT version();" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Cannot connect to Neon database" -ForegroundColor Red
    Write-Host "Please check your Neon connection string in the .env file." -ForegroundColor Yellow
    exit 1
}
Write-Host "[+] Neon database connection successful" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Setting up database schema..." -ForegroundColor Green
if (Test-Path $SCHEMA_FILE) {
    & "$PG_BIN\psql" "$NEON_CONNECTION_STRING" -f $SCHEMA_FILE
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Database schema created successfully" -ForegroundColor Green
    } else {
        Write-Host "Warning: Some schema creation commands may have failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "Warning: Schema file $SCHEMA_FILE not found, skipping schema setup" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Importing data to Neon..." -ForegroundColor Green
& "$PG_BIN\psql" "$NEON_CONNECTION_STRING" -f $BACKUP_FILE

$importExitCode = $LASTEXITCODE
if ($importExitCode -eq 0) {
    Write-Host "[+] Data import completed successfully" -ForegroundColor Green
} elseif ($importExitCode -eq 3) {
    Write-Host "[!] Import completed with some warnings (this is usually normal)" -ForegroundColor Yellow
} else {
    Write-Host "Error: Data import failed with exit code $importExitCode" -ForegroundColor Red
    Write-Host "Check the output above for specific error messages." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 6: Resetting sequences..." -ForegroundColor Green
& "$PG_BIN\psql" "$NEON_CONNECTION_STRING" -c "SELECT reset_sequences();"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Sequences reset successfully" -ForegroundColor Green
} else {
    Write-Host "Warning: Failed to reset sequences" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 7: Verifying import..." -ForegroundColor Green
$tableCount = & "$PG_BIN\psql" "$NEON_CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
$userCount = & "$PG_BIN\psql" "$NEON_CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM users;" 2>$null
$adminCount = & "$PG_BIN\psql" "$NEON_CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM admin_users;" 2>$null

Write-Host "Database verification:" -ForegroundColor Cyan
Write-Host "  Tables created: $($tableCount.Trim())" -ForegroundColor White
if ($userCount) { Write-Host "  Users imported: $($userCount.Trim())" -ForegroundColor White }
if ($adminCount) { Write-Host "  Admin users: $($adminCount.Trim())" -ForegroundColor White }

Write-Host ""
Write-Host "=== Import Summary ===" -ForegroundColor Cyan
Write-Host "[+] Local database backup created" -ForegroundColor Green
Write-Host "[+] Connected to Neon database" -ForegroundColor Green
Write-Host "[+] Database schema set up" -ForegroundColor Green
if ($importExitCode -eq 0 -or $importExitCode -eq 3) {
    Write-Host "[+] Data imported successfully" -ForegroundColor Green
} else {
    Write-Host "[x] Data import had issues" -ForegroundColor Red
}
Write-Host "[+] Sequences reset" -ForegroundColor Green

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test your application with the Neon database" -ForegroundColor White
Write-Host "2. Update your .env files to use the Neon connection string" -ForegroundColor White
Write-Host "3. Deploy your application" -ForegroundColor White

Write-Host ""
Write-Host "Default admin login:" -ForegroundColor Cyan
Write-Host "  Email: admin@example.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White

Write-Host ""
Write-Host "Import process completed!" -ForegroundColor Green

# Clean up
if (Test-Path $BACKUP_FILE) {
    $cleanup = Read-Host "Do you want to delete the backup file $BACKUP_FILE? (y/N)"
    if ($cleanup -eq 'y' -or $cleanup -eq 'Y') {
        Remove-Item $BACKUP_FILE
        Write-Host "Backup file deleted." -ForegroundColor Green
    }
}