# Database Setup and Migration Guide

## Overview

This guide covers database setup for the E-Connect project, including local development and production deployment to Neon.

## Quick Setup

### For Development (Local PostgreSQL)

1. **Install PostgreSQL** locally
2. **Create database**:
   ```sql
   CREATE DATABASE econnect;
   ```
3. **Run schema setup**:
   ```bash
   psql -d econnect -f neon-migration.sql
   ```

### For Production (Neon)

1. **Automated import** (recommended):
   ```bash
   npm run import-to-neon
   ```

2. **Manual import**:
   ```bash
   # Create schema
   psql "$NEON_CONNECTION_STRING" -f neon-migration.sql
   
   # Import data (if migrating)
   pg_dump -d econnect | psql "$NEON_CONNECTION_STRING"
   
   # Reset sequences
   psql "$NEON_CONNECTION_STRING" -c "SELECT reset_sequences();"
   ```

## Environment Configuration

### Backend Environment (`.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your_secure_jwt_secret_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Your App <your-email@gmail.com>

# Application
PORT=20001
APP_URL=http://localhost:3000
```

### Frontend Environment (`.env`)

```env
# API Configuration
VITE_API_URL=http://localhost:20001
```

## Database Schema

### Core Tables

- **users** - User accounts and profiles
- **admin_users** - Administrator accounts
- **email_verification** - Email verification tokens
- **password_reset_tokens** - Password reset functionality

### Feature Tables

- **donations** - Donation tracking and management
- **user_goals** - Personal environmental goals
- **goal_activities** - Goal progress tracking
- **contact_messages** - Contact form submissions

### System Tables

- **user_notifications** - User notification system
- **admin_notifications** - Admin notification system
- **ad_clicks** - Advertisement analytics

## Migration Scripts

### Available Scripts

| Script | Purpose | Platform |
|--------|---------|----------|
| `neon-migration.sql` | Complete schema setup | All |
| `import-to-neon.ps1` | Automated import | Windows |
| `import-to-neon.js` | Automated import | Cross-platform |

### NPM Scripts

```bash
# Import to Neon (Node.js)
npm run import-to-neon

# Import to Neon (PowerShell)
npm run import-to-neon:ps
```

## Troubleshooting

### Common Issues

**Connection Errors**:
- Verify connection string format
- Check firewall/network settings
- Ensure database exists

**Import Errors**:
- Check PostgreSQL tools are installed
- Verify source database accessibility
- Review error messages for specific issues

**Sequence Issues**:
- Run `SELECT reset_sequences();` after data import
- Manually reset specific sequences if needed

### Manual Sequence Reset

```sql
-- Reset all sequences automatically
SELECT reset_sequences();

-- Or reset individual sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('admin_users_id_seq', (SELECT MAX(id) FROM admin_users));
```

## Security Best Practices

1. **Environment Variables**:
   - Never commit `.env` files
   - Use strong, unique passwords
   - Rotate JWT secrets regularly

2. **Database Security**:
   - Use SSL connections in production
   - Limit database user permissions
   - Regular security updates

3. **Application Security**:
   - Change default admin credentials
   - Implement rate limiting
   - Validate all inputs

## Performance Optimization

### Database Indexes

The schema includes optimized indexes for:
- User lookups (email, username)
- Donation queries (status, date, project)
- Notification filtering (read status, user)
- Goal tracking (user, category)

### Query Optimization

- Use prepared statements
- Implement pagination for large datasets
- Monitor slow queries
- Consider read replicas for heavy read workloads

## Backup and Recovery

### Automated Backups

```bash
# Create backup
pg_dump -d econnect -f backup_$(date +%Y%m%d).sql

# Restore backup
psql -d econnect -f backup_20240101.sql
```

### Neon Backups

Neon provides automatic backups:
- Point-in-time recovery
- Branch-based development
- Automated daily backups

## Development Workflow

1. **Local Development**:
   - Use local PostgreSQL for development
   - Test migrations locally first
   - Use database branches for feature development

2. **Staging**:
   - Deploy to Neon staging branch
   - Run full test suite
   - Validate data migrations

3. **Production**:
   - Deploy to Neon production
   - Monitor performance metrics
   - Maintain backup schedules

## Monitoring and Maintenance

### Health Checks

```sql
-- Check database connectivity
SELECT version();

-- Verify table counts
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables;

-- Check index usage
SELECT 
  indexrelname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes;
```

### Performance Monitoring

- Monitor connection counts
- Track query performance
- Watch for lock contention
- Monitor storage usage

## Support and Resources

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Neon Documentation**: https://neon.tech/docs/
- **Node.js pg Library**: https://node-postgres.com/

For project-specific issues, check the troubleshooting section or create an issue in the project repository.