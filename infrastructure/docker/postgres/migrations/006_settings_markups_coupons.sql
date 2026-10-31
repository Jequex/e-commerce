-- Migration 006: App Settings, Default Category Markups, Admin Category Markups, and Coupons

\c ecommerce_store;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS app_name varchar(255) DEFAULT 'Jequex E-Commerce';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS app_logo_url varchar(500);

\c ecommerce_products;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS default_markup_percentage numeric(5,2) DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS admin_category_markups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL,
    admin_name text,
    admin_email text,
    category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    markup_percentage numeric(5,2) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_admin_category UNIQUE (admin_id, category_id)
);

CREATE TABLE IF NOT EXISTS coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE,
    description text,
    discount_type varchar(20) NOT NULL DEFAULT 'percentage',
    discount_value numeric(10,2) NOT NULL,
    applies_to varchar(30) NOT NULL DEFAULT 'all_products',
    product_ids jsonb DEFAULT '[]'::jsonb,
    min_purchase_amount numeric(10,2) DEFAULT 0.00,
    max_discount_amount numeric(10,2),
    usage_limit integer,
    times_used integer DEFAULT 0,
    start_date timestamp,
    end_date timestamp,
    is_active boolean DEFAULT true,
    store_id uuid,
    created_by_id uuid,
    created_by_name text,
    created_by_role text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);
