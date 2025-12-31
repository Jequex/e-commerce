-- Add missing columns to order_line_items table
ALTER TABLE order_line_items 
ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS barcode VARCHAR(255),
ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 3),
ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
ADD COLUMN IF NOT EXISTS fulfillable_quantity INTEGER;

-- Add missing columns to shopping_carts table
ALTER TABLE shopping_carts
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS note TEXT;

-- Add missing columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_info JSONB,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS attributes JSONB,
ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS carrier VARCHAR(100),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Create index on session_id for faster guest cart lookups
CREATE INDEX IF NOT EXISTS idx_shopping_carts_session_id ON shopping_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON shopping_carts(user_id);
