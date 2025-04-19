-- Drop the existing admin_users table if it exists
DROP TABLE IF EXISTS admin_users CASCADE;

-- Create a completely separate admin_users table
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  admin_level VARCHAR(50) NOT NULL DEFAULT 'standard',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_admin_updated_at();

-- Insert a default admin user with the CORRECT bcrypt hash
INSERT INTO admin_users (
  username, 
  email, 
  password, 
  admin_level, 
  permissions
  
) 
VALUES (
  'Admin', 
  'admin@example.com', 
  -- Updated hash that correctly matches 'admin123'
  '$2b$10$4RvKP.XnDuIToZxjDxL1yOWB7mol8bsJCVkza5umQtvloGR6OAjQy', 
  'super', 
  '{"all": true}'
)
ON CONFLICT (email) DO UPDATE 
SET 
  admin_level = 'super',
  permissions = '{"all": true}',
  updated_at = NOW();



-- Add avatar column to admin_users table
ALTER TABLE admin_users ADD COLUMN avatar TEXT;

-- Add updated_at column to admin_users table with default value
ALTER TABLE admin_users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();