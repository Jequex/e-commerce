-- Add demo_video column to products table
\c ecommerce_products;

ALTER TABLE products ADD COLUMN IF NOT EXISTS demo_video text;

