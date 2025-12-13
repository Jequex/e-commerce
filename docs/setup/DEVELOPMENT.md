# Development Setup with Live File Syncing

This setup enables automatic synchronization of file changes between your local development environment and Docker containers.

## 🚀 Quick Start

### Start Development Environment
```bash
# Using the convenience script
./scripts/dev-start.sh

# Or manually
docker-compose -f docker-compose.dev.yml up --build
```

### Stop Development Environment
```bash
# Using the convenience script
./scripts/dev-stop.sh

# Or manually
docker-compose -f docker-compose.dev.yml down
```

## 📁 What's Different in Development Mode

### Volume Mounts for Live Syncing
- **Source code directories** are mounted from host to containers
- **node_modules** are preserved in containers (anonymous volumes)
- **Configuration files** are synced for immediate updates

### Development Commands
- Services run with `npm run dev` instead of production builds
- **tsx watch** provides hot reloading for TypeScript services
- **Next.js dev server** provides hot reloading for React apps

### File Syncing Locations

**Microservices:**
- `./services/[service]/src` → `/app/src`
- `./services/[service]/package.json` → `/app/package.json`
- `./services/[service]/tsconfig.json` → `/app/tsconfig.json`

**Frontend Apps:**
- `./apps/[app]/src` → `/app/src`
- `./apps/[app]/public` → `/app/public`
- Configuration files (next.config.js, tailwind.config.js, etc.)

## 🔄 How Live Syncing Works

1. **File Change Detection**: When you modify files locally, changes are immediately reflected in containers
2. **Hot Reloading**: Development servers automatically restart/rebuild when files change
3. **Instant Feedback**: See changes in browser/API responses within seconds

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Customer-facing website |
| Admin App | http://localhost:3005 | Admin dashboard |
| Auth Service | http://localhost:3001 | Authentication API |
| Product Service | http://localhost:3002 | Product catalog API |
| Order Service | http://localhost:3003 | Order management API |
| Payment Service | http://localhost:3004 | Payment processing API |
| API Gateway | http://localhost:8080 | Unified API endpoint |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache & sessions |
| Elasticsearch | http://localhost:9200 | Search engine |

## 🛠️ Development Workflow

1. **Start the environment**: `./scripts/dev-start.sh`
2. **Make code changes** in your local files
3. **Changes are automatically synced** to containers
4. **Services restart automatically** with new changes
5. **Test immediately** - no manual rebuilds needed!

## 📝 Notes

- **First run** will take longer as it builds all containers
- **Subsequent runs** are faster due to Docker layer caching
- **node_modules** are managed inside containers to avoid platform conflicts
- **Database data** persists between container restarts

## 🐛 Troubleshooting

### If changes aren't syncing:
```bash
# Restart the development environment
./scripts/dev-stop.sh
./scripts/dev-start.sh
```

### If containers won't start:
```bash
# Clean up and restart
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

### Check service logs:
```bash
# View logs for a specific service
docker logs ecommerce-auth-service -f

# View logs for all services
docker-compose -f docker-compose.dev.yml logs -f
```