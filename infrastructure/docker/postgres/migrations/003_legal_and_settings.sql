-- Migration for legal documents and site settings in ecommerce_store

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  business_hours TEXT,
  support_hours TEXT,
  social_facebook VARCHAR(255),
  social_twitter VARCHAR(255),
  social_instagram VARCHAR(255),
  social_linkedin VARCHAR(255),
  admin_app_url VARCHAR(500) DEFAULT 'http://localhost:3006',
  updated_by_id UUID,
  updated_by_name VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  current_version VARCHAR(20) DEFAULT '1.0' NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS legal_document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  effective_date TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by_id UUID,
  created_by_name VARCHAR(255),
  created_by_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legal_doc_versions_type ON legal_document_versions(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_doc_versions_created_at ON legal_document_versions(created_at DESC);

-- Seed initial contact settings if not exists
INSERT INTO site_settings (
  id, phone, email, address, city, state, postal_code, country, business_hours, support_hours
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '+1 (800) 555-0199',
  'support@jequex.com',
  '123 Commerce Boulevard, Suite 500',
  'San Francisco',
  'CA',
  '94105',
  'United States',
  'Mon - Fri: 9:00 AM - 6:00 PM EST',
  '24/7 Priority Support'
) ON CONFLICT (id) DO NOTHING;

-- Seed initial legal documents and versions
INSERT INTO legal_documents (id, type, title, description, current_version)
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'privacy_policy', 'Privacy Policy', 'Details how user data is collected, stored, and processed.', '1.0'),
  ('b0000000-0000-0000-0000-000000000002', 'terms_conditions', 'Terms & Conditions', 'Governing terms for using our platform and making purchases.', '1.0'),
  ('b0000000-0000-0000-0000-000000000003', 'cancellation_refund', 'Cancellation & Refund Policy', 'Rules and timelines for order cancellations, returns, and refunds.', '1.0')
ON CONFLICT (type) DO NOTHING;

INSERT INTO legal_document_versions (
  document_type, version, title, content, change_summary, created_by_name, created_by_email, is_active
) VALUES 
(
  'privacy_policy',
  '1.0',
  'Privacy Policy',
  '# Privacy Policy\n\n**Effective Date:** January 1, 2026\n\nWe value your privacy. This policy outlines our collection, usage, and protection of your personal information when using our ecommerce platform.\n\n### 1. Information We Collect\nWe collect information you provide directly to us, such as your name, email, shipping address, and payment information.\n\n### 2. How We Use Information\nWe use your information to fulfill orders, process payments, prevent fraud, and provide customer support.\n\n### 3. Data Protection\nAll personal data is encrypted in transit and at rest using industry-standard protocols.',
  'Initial version published',
  'System Super Admin',
  'superadmin@ecommerce.com',
  true
),
(
  'terms_conditions',
  '1.0',
  'Terms & Conditions',
  '# Terms and Conditions\n\n**Effective Date:** January 1, 2026\n\nBy accessing or using our ecommerce platform, you agree to be bound by these Terms and Conditions.\n\n### 1. Account Responsibilities\nYou are responsible for maintaining the confidentiality of your account credentials.\n\n### 2. Purchases and Pricing\nPrices are subject to change without notice. We reserve the right to refuse or cancel any order.\n\n### 3. Governing Law\nThese terms shall be governed by and construed in accordance with applicable commerce laws.',
  'Initial version published',
  'System Super Admin',
  'superadmin@ecommerce.com',
  true
),
(
  'cancellation_refund',
  '1.0',
  'Cancellation & Refund Policy',
  '# Cancellation and Refund Policy\n\n**Effective Date:** January 1, 2026\n\n### 1. Order Cancellation\nYou may cancel your order within 2 hours of placement or before shipment begins.\n\n### 2. Returns and Refunds\nItems can be returned within 30 days of delivery in original condition. Refunds are issued to the original payment method within 5-7 business days.',
  'Initial version published',
  'System Super Admin',
  'superadmin@ecommerce.com',
  true
);

