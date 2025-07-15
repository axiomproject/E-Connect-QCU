# E-Connect Neon Database Import Guide

This guide will help you import your existing PostgreSQL database to Neon, a serverless PostgreSQL platform.

## Prerequisites

- PostgreSQL installed locally with `psql` and `pg_dump` tools
- Access to your existing E-Connect database
- Neon account and database created
- Your Neon connection string (already in your `.env` file)

## Quick Start

### Option 1: Automated Script (Recommended)

1. **Configure the script**: Open `import-to-neon.ps1` and update these variables:
   ```powershell
   $LOCAL_DB_NAME = "econnect"     # Your local database name
   $LOCAL_DB_USER = "postgres"     # Your PostgreSQL username
   $LOCAL_DB_PASSWORD = "test"     # Your PostgreSQL password
   $PG_BIN = "C:\Program Files\PostgreSQL\17\bin"  # PostgreSQL tools path
   ```

2. **Run the import script**:
   ```powershell
   .\import-to-neon.ps1
   ```

3. **Follow the prompts** and monitor the output for any errors.

### Option 2: Manual Steps

If you prefer to run the commands manually:

#### Step 1: Create Database Schema

```bash
psql "postgresql://neondb_owner:npg_lj5JFGAIE2Kn@ep-cold-bird-a1oa51jk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -f neon-migration.sql
```

#### Step 2: Export Your Local Database

```bash
pg_dump -h localhost -U postgres -d econnect -f econnect_backup.sql --no-owner --no-privileges --clean --if-exists
```

#### Step 3: Import to Neon

```bash
psql "postgresql://neondb_owner:npg_lj5JFGAIE2Kn@ep-cold-bird-a1oa51jk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -f econnect_backup.sql
```

#### Step 4: Reset Sequences

```bash
psql "postgresql://neondb_owner:npg_lj5JFGAIE2Kn@ep-cold-bird-a1oa51jk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -c "SELECT reset_sequences();"
```

## Database Schema Overview

The migration script creates the following tables:

### Core Tables
- **users** - Main user accounts
- **admin_users** - Administrator accounts
- **email_verification** - Email verification tokens
- **password_reset_tokens** - Password reset functionality

### Feature Tables
- **donations** - Donation tracking
- **user_goals** - Personal environmental goals
- **goal_activities** - Goal activity tracking
- **contact_messages** - Contact form submissions

### Notification System
- **user_notifications** - User notifications
- **admin_notifications** - Admin notifications

### Analytics
- **ad_clicks** - Advertisement click tracking

## Environment Configuration

Your Neon connection string is already configured in:
- `backend/.env`: `DATABASE_URL=postgresql://neondb_owner:npg_lj5JFGAIE2Kn@ep-cold-bird-a1oa51jk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

The application will automatically use this connection string when running.

## Default Admin Account

After migration, you can log in with:
- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **Important**: Change this password immediately after your first login!

## Verification Steps

After import, verify everything works:

1. **Check table creation**:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

2. **Verify data import**:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM admin_users;
   ```

3. **Test application connection**:
   - Start your backend: `npm run dev` (from backend directory)
   - Check the console for "Database connected successfully"

## Troubleshooting

### Common Issues

**Connection Errors**:
- Verify your Neon connection string is correct
- Check if your IP is whitelisted in Neon dashboard
- Ensure SSL is properly configured

**Import Errors**:
- Some warnings are normal (like "relation already exists")
- Exit code 3 usually means partial success with warnings
- Check for specific error messages in the output

**Sequence Issues**:
- If you get "duplicate key" errors, run: `SELECT reset_sequences();`
- This fixes auto-increment sequences after data import

**Permission Errors**:
- Ensure your Neon user has proper permissions
- The connection string should include the correct user credentials

### Manual Sequence Reset

If the automatic sequence reset fails:

```sql
-- Reset users sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Reset admin_users sequence
SELECT setval('admin_users_id_seq', (SELECT MAX(id) FROM admin_users));

-- Reset other sequences as needed
SELECT setval('donations_id_seq', (SELECT MAX(id) FROM donations));
```

## Performance Optimization

The migration script includes several optimizations:

- **Indexes** on frequently queried columns
- **Triggers** for automatic timestamp updates
- **Foreign key constraints** for data integrity
- **JSONB columns** for flexible data storage

## Security Considerations

1. **Change default passwords** immediately
2. **Review admin permissions** in the admin_users table
3. **Update JWT secrets** in your environment variables
4. **Enable proper SSL/TLS** in production

## Next Steps

1. **Test your application** with the new Neon database
2. **Update any hardcoded connection strings** in your code
3. **Configure backup strategies** in Neon dashboard
4. **Monitor performance** and optimize queries as needed
5. **Set up monitoring** and alerts in Neon

## Support

If you encounter issues:

1. Check the Neon dashboard for connection status
2. Review the PostgreSQL logs for detailed error messages
3. Verify your local database has the expected data
4. Test the connection string manually with `psql`

## Files Created

- `neon-migration.sql` - Complete database schema
- `import-to-neon.ps1` - Automated import script
- `NEON_IMPORT_GUIDE.md` - This guide

Keep these files for future reference or additional deployments.

---

**Happy coding! 🚀**

Your E-Connect application is now ready to run on Neon's serverless PostgreSQL platform.