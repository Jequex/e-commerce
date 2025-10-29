-- Create databases for each microservice
CREATE DATABASE ecommerce_auth;
CREATE DATABASE ecommerce_products;
CREATE DATABASE ecommerce_orders;
CREATE DATABASE ecommerce_payments;
CREATE DATABASE ecommerce_emails;
CREATE DATABASE ecommerce_notifications;
CREATE DATABASE ecommerce_users;
CREATE DATABASE ecommerce_inventory;
CREATE DATABASE ecommerce_analytics;

-- Create users for each service (optional, for better security)
CREATE USER auth_user WITH PASSWORD 'auth_password';
CREATE USER product_user WITH PASSWORD 'product_password';
CREATE USER order_user WITH PASSWORD 'order_password';
CREATE USER payment_user WITH PASSWORD 'payment_password';
CREATE USER email_user WITH PASSWORD 'email_password';
CREATE USER notification_user WITH PASSWORD 'notification_password';
CREATE USER user_service_user WITH PASSWORD 'user_password';
CREATE USER inventory_user WITH PASSWORD 'inventory_password';
CREATE USER analytics_user WITH PASSWORD 'analytics_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ecommerce_auth TO auth_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_products TO product_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_orders TO order_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_payments TO payment_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_emails TO email_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_notifications TO notification_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_users TO user_service_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_inventory TO inventory_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_analytics TO analytics_user;

-- Grant all privileges to the main user as well
GRANT ALL PRIVILEGES ON DATABASE ecommerce_auth TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_products TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_orders TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_payments TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_emails TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_notifications TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_users TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_inventory TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_analytics TO ecommerce;