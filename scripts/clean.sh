#!/bin/bash
set -e

echo "🧹 Cleaning e-commerce monorepo..."

# Clean all node_modules
echo "Removing node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Clean build artifacts
echo "Removing build artifacts..."
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name "build" -type d -prune -exec rm -rf '{}' +

# Clean cache files
echo "Removing cache files..."
find . -name ".turbo" -type d -prune -exec rm -rf '{}' +
find . -name ".cache" -type d -prune -exec rm -rf '{}' +

# Clean logs
echo "Removing log files..."
find . -name "*.log" -type f -delete
find . -name "logs" -type d -prune -exec rm -rf '{}' +

# Clean Docker volumes (optional)
if [ "$1" = "--docker" ]; then
    echo "Cleaning Docker volumes..."
    docker-compose down -v
    docker system prune -f
fi

echo "✅ Cleanup complete!"

# Reinstall dependencies
if [ "$1" = "--install" ] || [ "$2" = "--install" ]; then
    echo "📦 Reinstalling dependencies..."
    npm install
    echo "✅ Dependencies reinstalled!"
fi