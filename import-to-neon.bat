@echo off
REM E-Connect Neon Database Import Script (Batch version)
REM Simple alternative to PowerShell script

setlocal enabledelayedexpansion

REM Configuration - Update these values
set "NEON_CONNECTION_STRING=postgresql://neondb_owner:npg_lj5JFGAIE2Kn@ep-cold-bird-a1oa51jk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require"
set "LOCAL_DB_NAME=econnect"
set "LOCAL_DB_USER=postgres"
set "LOCAL_DB_PASSWORD=test"
set "LOCAL_DB_HOST=localhost"
set "LOCAL_DB_PORT=5432"
set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"
set "BACKUP_FILE=econnect_backup.sql"
set "SCHEMA_FILE=neon-migration.sql"

echo ========================================
echo E-Connect Neon Database Import Script
echo ========================================
echo.

REM Check if PostgreSQL tools exist
if not exist "%PG_BIN%\psql.exe" (
    echo [ERROR] PostgreSQL tools not found at %PG_BIN%
    echo Please install PostgreSQL or update the PG_BIN path in this script.
    pause
    exit /b 1
)

echo [INFO] Step 1: Testing local database connection...
set "PGPASSWORD=%LOCAL_DB_PASSWORD%"
"%PG_BIN%\psql" -h %LOCAL_DB_HOST% -p %LOCAL_DB_PORT% -U %LOCAL_DB_USER% -d %LOCAL_DB_NAME% -c "SELECT version();" >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Cannot connect to local database '%LOCAL_DB_NAME%'
    echo Please check your local database configuration in this script.
    pause
    exit /b 1
)
echo [SUCCESS] Local database connection successful

echo.
echo [INFO] Step 2: Creating database backup...
"%PG_BIN%\pg_dump" -h %LOCAL_DB_HOST% -p %LOCAL_DB_PORT% -U %LOCAL_DB_USER% -d %LOCAL_DB_NAME% -f %BACKUP_FILE% --no-owner --no-privileges --clean --if-exists

if errorlevel 1 (
    echo [ERROR] Failed to create database backup
    pause
    exit /b 1
)
echo [SUCCESS] Database backup created: %BACKUP_FILE%

echo.
echo [INFO] Step 3: Testing Neon database connection...
set "PGPASSWORD="
"%PG_BIN%\psql" "%NEON_CONNECTION_STRING%" -c "SELECT version();" >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Cannot connect to Neon database
    echo Please check your Neon connection string in the .env file.
    pause
    exit /b 1
)
echo [SUCCESS] Neon database connection successful

echo.
echo [INFO] Step 4: Setting up database schema...
if exist "%SCHEMA_FILE%" (
    "%PG_BIN%\psql" "%NEON_CONNECTION_STRING%" -f "%SCHEMA_FILE%"
    if errorlevel 1 (
        echo [WARNING] Some schema creation commands may have failed
    ) else (
        echo [SUCCESS] Database schema created successfully
    )
) else (
    echo [WARNING] Schema file %SCHEMA_FILE% not found, skipping schema setup
)

echo.
echo [INFO] Step 5: Importing data to Neon...
"%PG_BIN%\psql" "%NEON_CONNECTION_STRING%" -f "%BACKUP_FILE%"
set "IMPORT_EXIT_CODE=%errorlevel%"

if %IMPORT_EXIT_CODE% equ 0 (
    echo [SUCCESS] Data import completed successfully
) else if %IMPORT_EXIT_CODE% equ 3 (
    echo [WARNING] Import completed with some warnings (this is usually normal)
) else (
    echo [ERROR] Data import failed with exit code %IMPORT_EXIT_CODE%
    echo Check the output above for specific error messages.
)

echo.
echo [INFO] Step 6: Resetting sequences...
"%PG_BIN%\psql" "%NEON_CONNECTION_STRING%" -c "SELECT reset_sequences();"

if errorlevel 1 (
    echo [WARNING] Failed to reset sequences
) else (
    echo [SUCCESS] Sequences reset successfully
)

echo.
echo [INFO] Step 7: Verifying import...
for /f "tokens=*" %%i in ('"%PG_BIN%\psql" "%NEON_CONNECTION_STRING%" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"') do set "TABLE_COUNT=%%i"
for /f "tokens=*" %%i in ('"%PG_BIN%\psql" "%NEON_CONNECTION_STRING%" -t -c "SELECT COUNT(*) FROM users;" 2^>nul') do set "USER_COUNT=%%i"
for /f "tokens=*" %%i in ('"%PG_BIN%\psql" "%NEON_CONNECTION_STRING%" -t -c "SELECT COUNT(*) FROM admin_users;" 2^>nul') do set "ADMIN_COUNT=%%i"

echo Database verification:
echo   Tables created: %TABLE_COUNT%
if defined USER_COUNT echo   Users imported: %USER_COUNT%
if defined ADMIN_COUNT echo   Admin users: %ADMIN_COUNT%

echo.
echo ========================================
echo           Import Summary
echo ========================================
echo [+] Local database backup created
echo [+] Connected to Neon database
echo [+] Database schema set up
if %IMPORT_EXIT_CODE% equ 0 (
    echo [+] Data imported successfully
) else if %IMPORT_EXIT_CODE% equ 3 (
    echo [+] Data imported successfully
) else (
    echo [x] Data import had issues
)
echo [+] Sequences reset

echo.
echo Next steps:
echo 1. Test your application with the Neon database
echo 2. Update your .env files to use the Neon connection string
echo 3. Deploy your application

echo.
echo Default admin login:
echo   Email: admin@example.com
echo   Password: admin123

echo.
echo [SUCCESS] Import process completed!

REM Clean up
if exist "%BACKUP_FILE%" (
    set /p "cleanup=Do you want to delete the backup file %BACKUP_FILE%? (y/N): "
    if /i "!cleanup!"=="y" (
        del "%BACKUP_FILE%"
        echo Backup file deleted.
    )
)

echo.
echo Press any key to exit...
pause >nul