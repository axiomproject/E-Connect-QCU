CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  project_id VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_details JSONB,
  is_recurring BOOLEAN DEFAULT FALSE,
  donor_first_name VARCHAR(100) NOT NULL,
  donor_last_name VARCHAR(100) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  donor_phone VARCHAR(50),
  donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'verified', 'rejected'
  notes TEXT,
  
  -- Admin fields
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  verified_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejected_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Index for performance optimization
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_project_id ON donations(project_id);
CREATE INDEX idx_donations_donation_date ON donations(donation_date);
