CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_legal_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  version_number VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_legal_consents_user_id ON user_legal_consents(user_id);

-- Insert or update default Super Admin
INSERT INTO users (
  id, email, password_hash, first_name, last_name, role, status, email_verified, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'superadmin@ecommerce.com',
  '$2a$12$VLTMtu/nvymEvVtw3QzPj.d54rRf2/qgf6h/OMXVuoa053RXHJJci',
  'Super',
  'Admin',
  'super_admin',
  'active',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  password_hash = '$2a$12$VLTMtu/nvymEvVtw3QzPj.d54rRf2/qgf6h/OMXVuoa053RXHJJci',
  status = 'active';

