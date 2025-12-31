-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID,
  
  -- Order status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  financial_status VARCHAR(50) DEFAULT 'pending',
  fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
  
  -- Customer information
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  customer_note TEXT,
  
  -- Pricing
  subtotal_price DECIMAL(10, 2) NOT NULL,
  total_tax DECIMAL(10, 2) DEFAULT 0,
  total_discounts DECIMAL(10, 2) DEFAULT 0,
  total_shipping DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Addresses
  billing_address JSONB,
  shipping_address JSONB,
  
  -- Shipping
  shipping_method VARCHAR(100),
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  
  -- Additional info
  tags TEXT[],
  source VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  
  -- Important dates
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancel_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create order line items table
CREATE TABLE IF NOT EXISTS order_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  product_id UUID NOT NULL,
  variant_id UUID,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  product_title VARCHAR(255) NOT NULL,
  variant_title VARCHAR(255),
  sku VARCHAR(100),
  
  properties JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create order transactions table
CREATE TABLE IF NOT EXISTS order_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  kind VARCHAR(50) NOT NULL,
  gateway VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  gateway_transaction_id TEXT,
  parent_id UUID,
  
  message TEXT,
  error_code TEXT,
  receipt JSONB,
  
  is_test BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create order fulfillments table
CREATE TABLE IF NOT EXISTS order_fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  tracking_company VARCHAR(100),
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  
  shipment_status VARCHAR(50),
  estimated_delivery_date DATE,
  
  notify_customer BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create order fulfillment line items table
CREATE TABLE IF NOT EXISTS order_fulfillment_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fulfillment_id UUID NOT NULL REFERENCES order_fulfillments(id) ON DELETE CASCADE,
  line_item_id UUID NOT NULL REFERENCES order_line_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create order discounts table
CREATE TABLE IF NOT EXISTS order_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  code VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  
  title VARCHAR(255),
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create order events table
CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL,
  description TEXT,
  
  actor_id UUID,
  actor_type VARCHAR(50),
  
  previous_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create shopping carts table
CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create cart line items table
CREATE TABLE IF NOT EXISTS cart_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
  
  product_id UUID NOT NULL,
  variant_id UUID,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  
  properties JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_line_items_order_id ON order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_product_id ON order_line_items(product_id);

CREATE INDEX IF NOT EXISTS idx_order_transactions_order_id ON order_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_transactions_status ON order_transactions(status);

CREATE INDEX IF NOT EXISTS idx_order_fulfillments_order_id ON order_fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillment_line_items_fulfillment_id ON order_fulfillment_line_items(fulfillment_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillment_line_items_line_item_id ON order_fulfillment_line_items(line_item_id);

CREATE INDEX IF NOT EXISTS idx_order_discounts_order_id ON order_discounts(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);

CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_line_items_cart_id ON cart_line_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_line_items_product_id ON cart_line_items(product_id);
