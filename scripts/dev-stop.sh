#!/bin/bash

echo "🛑 Stopping E-commerce Development Environment..."

# Stop development containers
docker-compose -f docker-compose.dev.yml down

echo "✅ Development environment stopped!"