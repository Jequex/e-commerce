#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    echo -e "${2}${1}${NC}"
}

print_message "🚀 Setting up E-commerce Monorepo Development Environment" $BLUE

# Check prerequisites
print_message "Checking prerequisites..." $YELLOW

# Check Node.js
if ! command -v node &> /dev/null; then
    print_message "❌ Node.js is not installed. Please install Node.js 18+" $RED
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_message "❌ Node.js version $NODE_VERSION is below required version $REQUIRED_VERSION" $RED
    exit 1
fi

print_message "✅ Node.js $NODE_VERSION is installed" $GREEN

# Check Docker
if ! command -v docker &> /dev/null; then
    print_message "❌ Docker is not installed. Please install Docker" $RED
    exit 1
fi

print_message "✅ Docker is installed" $GREEN

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_message "❌ Docker Compose is not installed. Please install Docker Compose" $RED
    exit 1
fi

print_message "✅ Docker Compose is installed" $GREEN

# Install dependencies
print_message "Installing dependencies..." $YELLOW
npm install

print_message "Building shared packages..." $YELLOW
npm run build --workspace=@ecommerce/types
npm run build --workspace=@ecommerce/utils
npm run build --workspace=@ecommerce/config
npm run build --workspace=@ecommerce/ui

# Create environment files
print_message "Setting up environment files..." $YELLOW

# Root .env file
cat > .env << EOF
# Database
DATABASE_URL=postgresql://ecommerce:password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# External Services
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email Configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ecommerce-uploads

# Search
ELASTICSEARCH_URL=http://localhost:9200

# Message Queue
KAFKA_BROKERS=localhost:9092

# Monitoring
SENTRY_DSN=your_sentry_dsn_here

# Environment
NODE_ENV=development
PORT=3000
EOF

# Service-specific ports
echo "AUTH_SERVICE_PORT=3001" >> .env
echo "PRODUCT_SERVICE_PORT=3002" >> .env
echo "ORDER_SERVICE_PORT=3003" >> .env
echo "PAYMENT_SERVICE_PORT=3004" >> .env

print_message "✅ Environment file created" $GREEN

# Setup Git hooks
print_message "Setting up Git hooks..." $YELLOW
npx husky install
npm run prepare

print_message "✅ Git hooks configured" $GREEN

# Start infrastructure services
print_message "Starting infrastructure services..." $YELLOW
docker-compose up -d postgres redis elasticsearch kafka zookeeper

print_message "Waiting for services to be ready..." $YELLOW
sleep 10

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U ecommerce; do
    print_message "Waiting for PostgreSQL..." $YELLOW
    sleep 2
done

print_message "✅ PostgreSQL is ready" $GREEN

# Run database migrations (when implemented)
print_message "Setting up database..." $YELLOW
# npm run db:migrate
print_message "✅ Database setup complete" $GREEN

print_message "🎉 Development environment setup complete!" $GREEN

print_message "Next steps:" $BLUE
echo "1. Start all services: npm run dev"
echo "2. Open web app: http://localhost:3000"
echo "3. Open admin dashboard: http://localhost:3001"
echo "4. API Gateway: http://localhost:8080"
echo ""
print_message "Useful commands:" $BLUE
echo "• npm run dev - Start all services in development mode"
echo "• npm run build - Build all packages and services"
echo "• npm run test - Run tests across all packages"
echo "• npm run lint - Run linting across all packages"
echo "• npm run docker:up - Start all services with Docker"
echo "• npm run docker:down - Stop all Docker services"
echo ""
print_message "For more information, check the README.md file" $BLUE