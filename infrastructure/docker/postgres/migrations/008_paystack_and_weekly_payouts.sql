-- Migration 008: Paystack and Automatic Weekly Payouts

-- Connect to ecommerce_payments database tables
\connect ecommerce_payments;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Store Payout Settings (Bank details for stores receiving weekly payouts)
CREATE TABLE IF NOT EXISTS store_payout_settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid NOT NULL UNIQUE,
    admin_id uuid NOT NULL,
    bank_code varchar(50) NOT NULL,
    bank_name varchar(255) NOT NULL,
    account_number varchar(50) NOT NULL,
    account_name varchar(255) NOT NULL,
    paystack_recipient_code varchar(100),
    currency varchar(10) DEFAULT 'NGN',
    is_verified boolean DEFAULT false,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_store_payout_settings_store_id ON store_payout_settings(store_id);
CREATE INDEX IF NOT EXISTS idx_store_payout_settings_admin_id ON store_payout_settings(admin_id);

-- Payout Batches (Weekly Monday payout processing batches)
CREATE TABLE IF NOT EXISTS payout_batches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number varchar(50) NOT NULL UNIQUE,
    scheduled_date date NOT NULL,
    status varchar(50) DEFAULT 'pending',
    total_payout_amount numeric(12,2) DEFAULT 0.00,
    total_stores_count integer DEFAULT 0,
    processed_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payout_batches_scheduled_date ON payout_batches(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payout_batches_status ON payout_batches(status);

-- Store Payouts (Individual store payout within a weekly batch)
CREATE TABLE IF NOT EXISTS store_payouts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id uuid REFERENCES payout_batches(id) ON DELETE CASCADE,
    store_id uuid NOT NULL,
    admin_id uuid,
    amount numeric(12,2) NOT NULL,
    currency varchar(10) DEFAULT 'NGN',
    order_ids jsonb DEFAULT '[]'::jsonb,
    paystack_transfer_code varchar(100),
    paystack_reference varchar(100) UNIQUE,
    status varchar(50) DEFAULT 'pending',
    failure_reason text,
    bank_name varchar(255),
    account_number varchar(50),
    account_name varchar(255),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_store_payouts_batch_id ON store_payouts(batch_id);
CREATE INDEX IF NOT EXISTS idx_store_payouts_store_id ON store_payouts(store_id);
CREATE INDEX IF NOT EXISTS idx_store_payouts_status ON store_payouts(status);

-- Payment Transactions table in ecommerce_payments if not existing
CREATE TABLE IF NOT EXISTS payment_transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid,
    user_id uuid,
    store_id uuid,
    type varchar(50) NOT NULL DEFAULT 'payment',
    status varchar(50) NOT NULL DEFAULT 'pending',
    amount numeric(10,2) NOT NULL,
    currency varchar(10) DEFAULT 'NGN',
    provider varchar(50) NOT NULL DEFAULT 'paystack',
    provider_transaction_id varchar(150),
    provider_reference varchar(150),
    customer_email varchar(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    failure_code text,
    failure_message text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_ref ON payment_transactions(provider_reference);

-- Update ecommerce_orders to track weekly payout status on orders
\connect ecommerce_orders;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_status varchar(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_id uuid;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_batch_id uuid;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_out_at timestamp;

CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON orders(payout_status);
CREATE INDEX IF NOT EXISTS idx_orders_store_payout ON orders(store_id, payout_status);
