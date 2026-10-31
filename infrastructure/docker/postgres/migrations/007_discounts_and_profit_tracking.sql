-- Migration 007: Discount Attribution & Profit Tracking

\c ecommerce_orders;

-- Add profit and attribution tracking columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_markup_rate numeric(5,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_markup_amount numeric(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS super_admin_discount_amount numeric(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_discount_amount numeric(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_net_profit numeric(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_net_payout numeric(10,2) DEFAULT 0.00;

-- Add creator and funder attribution to order_discounts
ALTER TABLE order_discounts ADD COLUMN IF NOT EXISTS created_by_id uuid;
ALTER TABLE order_discounts ADD COLUMN IF NOT EXISTS created_by_role varchar(50) DEFAULT 'admin';
ALTER TABLE order_discounts ADD COLUMN IF NOT EXISTS created_by_name text;
ALTER TABLE order_discounts ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE order_discounts ADD COLUMN IF NOT EXISTS funded_by varchar(50) DEFAULT 'store';

-- Add product, category, markup, and discount attribution to order_line_items
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS store_id uuid;
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS cost_price numeric(10,2);
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS markup_percentage numeric(5,2) DEFAULT 0.00;
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS markup_amount numeric(10,2) DEFAULT 0.00;
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0.00;
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS discount_funded_by varchar(50) DEFAULT 'none';
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS store_payout numeric(10,2) DEFAULT 0.00;
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS platform_profit numeric(10,2) DEFAULT 0.00;

