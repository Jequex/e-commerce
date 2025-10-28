#!/bin/bash

echo "🚀 Starting E-commerce Development Environment..."
echo "This will start all services with live file syncing enabled."
echo ""

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker-compose -f docker-compose.yml down 2>/dev/null
docker-compose -f docker-compose.dev.yml down 2>/dev/null

# Build and start development environment
echo "🔨 Building and starting development containers..."
docker-compose -f docker-compose.dev.yml up --build

echo ""
echo "✅ Development environment started!"
echo ""
echo "📱 Services available at:"
echo "   • Web App: http://localhost:3000"
echo "   • Admin App: http://localhost:3005" 
echo "   • Auth Service: http://localhost:3001"
echo "   • Product Service: http://localhost:3002"
echo "   • Order Service: http://localhost:3003"
echo "   • Payment Service: http://localhost:3004"
echo "   • API Gateway: http://localhost:8080"
echo "   • PostgreSQL: localhost:5432"
echo "   • Redis: localhost:6379"
echo "   • Elasticsearch: http://localhost:9200"
echo ""
echo "🔄 Live file syncing is enabled - changes will be reflected automatically!"