-- =====================================================
-- Product Service Database Schema
-- =====================================================
-- Description: Comprehensive schema for product management
-- Version: 1.0.0
-- Date: 2025-12-13
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Categories Table
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Add comment to categories table
COMMENT ON TABLE categories IS 'Product categories with hierarchical support';
COMMENT ON COLUMN categories.parent_id IS 'Self-referencing for category hierarchy';
COMMENT ON COLUMN categories.slug IS 'URL-friendly unique identifier';

-- =====================================================
-- Products Table
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  store_id UUID,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  weight DECIMAL(8, 3),
  weight_unit TEXT DEFAULT 'kg',
  dimensions JSONB,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_digital BOOLEAN DEFAULT false,
  requires_shipping BOOLEAN DEFAULT true,
  taxable BOOLEAN DEFAULT true,
  track_quantity BOOLEAN DEFAULT true,
  continue_selling_when_out_of_stock BOOLEAN DEFAULT false,
  inventory_quantity INTEGER DEFAULT 0,
  inventory_policy TEXT DEFAULT 'deny',
  meta_title TEXT,
  meta_description TEXT,
  seo_url TEXT,
  tags JSONB,
  options JSONB,
  images JSONB,
  vendor TEXT,
  product_type TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_price_positive CHECK (price >= 0),
  CONSTRAINT chk_inventory_non_negative CHECK (inventory_quantity >= 0),
  CONSTRAINT chk_weight_positive CHECK (weight IS NULL OR weight > 0),
  CONSTRAINT chk_inventory_policy CHECK (inventory_policy IN ('deny', 'continue'))
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description ON products USING gin(to_tsvector('english', description));

-- Add comments to products table
COMMENT ON TABLE products IS 'Main products table with comprehensive product information';
COMMENT ON COLUMN products.store_id IS 'Reference to the store that owns this product';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN products.inventory_policy IS 'deny: stop selling when out of stock, continue: allow overselling';
COMMENT ON COLUMN products.dimensions IS 'JSON: {length, width, height, unit}';
COMMENT ON COLUMN products.tags IS 'JSON array of tag strings';
COMMENT ON COLUMN products.options IS 'JSON array of product options: [{name, values}]';
COMMENT ON COLUMN products.images IS 'JSON array of images: [{id, src, alt, position}]';

-- =====================================================
-- Product Variants Table
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  weight DECIMAL(8, 3),
  inventory_quantity INTEGER DEFAULT 0,
  inventory_item_id UUID,
  is_default BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  option1 TEXT,
  option2 TEXT,
  option3 TEXT,
  image JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_variant_price_positive CHECK (price >= 0),
  CONSTRAINT chk_variant_inventory_non_negative CHECK (inventory_quantity >= 0)
);

-- Create indexes for product_variants
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_position ON product_variants(position);
CREATE INDEX IF NOT EXISTS idx_variants_is_default ON product_variants(is_default);

-- Add comments to product_variants table
COMMENT ON TABLE product_variants IS 'Product variants for products with multiple options (size, color, etc.)';
COMMENT ON COLUMN product_variants.option1 IS 'First option value (e.g., Red, Small)';
COMMENT ON COLUMN product_variants.option2 IS 'Second option value';
COMMENT ON COLUMN product_variants.option3 IS 'Third option value';
COMMENT ON COLUMN product_variants.image IS 'JSON: {id, src, alt, position}';

-- =====================================================
-- Product Reviews Table
-- =====================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT chk_helpful_count_non_negative CHECK (helpful_count >= 0),
  CONSTRAINT chk_report_count_non_negative CHECK (report_count >= 0)
);

-- Create indexes for product_reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON product_reviews(created_at DESC);

-- Add comments to product_reviews table
COMMENT ON TABLE product_reviews IS 'Customer reviews and ratings for products';
COMMENT ON COLUMN product_reviews.user_id IS 'Reference to user in auth service';
COMMENT ON COLUMN product_reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN product_reviews.is_verified_purchase IS 'True if user purchased the product';

-- =====================================================
-- Product Attributes Table
-- =====================================================
CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  is_filterable BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_attribute_type CHECK (type IN ('text', 'number', 'boolean', 'date'))
);

-- Create indexes for product_attributes
CREATE INDEX IF NOT EXISTS idx_attributes_product_id ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_attributes_name ON product_attributes(name);
CREATE INDEX IF NOT EXISTS idx_attributes_is_filterable ON product_attributes(is_filterable);

-- Add comments to product_attributes table
COMMENT ON TABLE product_attributes IS 'Flexible key-value attributes for products';
COMMENT ON COLUMN product_attributes.is_filterable IS 'If true, can be used for product filtering';

-- =====================================================
-- Triggers for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Sample Data (Optional - for development)
-- =====================================================
-- Insert sample categories
INSERT INTO categories (name, slug, description, is_active, sort_order) VALUES
  ('Electronics', 'electronics', 'Electronic devices and accessories', true, 1),
  ('Clothing', 'clothing', 'Fashion and apparel', true, 2),
  ('Home & Garden', 'home-garden', 'Home and garden products', true, 3),
  ('Books', 'books', 'Books and publications', true, 4),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports and outdoor equipment', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample subcategories
INSERT INTO categories (name, slug, description, parent_id, is_active, sort_order)
SELECT 
  'Smartphones', 'smartphones', 'Mobile phones and accessories', id, true, 1
FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id, is_active, sort_order)
SELECT 
  'Laptops', 'laptops', 'Portable computers', id, true, 2
FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Grants and Permissions
-- =====================================================
-- Grant appropriate permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO product_service_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO product_service_user;

-- =====================================================
-- Migration Complete
-- =====================================================
-- To verify the migration:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;
