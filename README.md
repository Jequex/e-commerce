# E-commerce Monorepo

A highly scalable, modern e-commerce platform built with Next.js, Node.js microservices, and cloud-native architecture.

## 🏗 Architecture Overview

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Web Client    │  │  Mobile Apps    │  │  Admin Panel    │
│   (Next.js)     │  │ (React Native)  │  │   (Next.js)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx)                      │
└─────────────────────────────────────────────────────────────┘
         │
┌────────┼────────────────────────────────────────────────────┐
│        │                                                     │
│  ┌─────▼─────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │   Auth    │ │ Product  │ │  Order   │ │   Payment    │   │
│  │ Service   │ │ Service  │ │ Service  │ │   Service    │   │
│  └───────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                                                             │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │   Cart    │ │Inventory │ │  Search  │ │Notification  │   │
│  │ Service   │ │ Service  │ │ Service  │ │   Service    │   │
│  └───────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **Web**: Next.js 14 with TypeScript and Tailwind CSS
- **Mobile**: React Native (planned)
- **Admin**: Next.js with advanced dashboard components
- **State Management**: Zustand + TanStack Query

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with microservices architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis
- **Search**: Elasticsearch
- **Message Queue**: Apache Kafka
- **File Storage**: AWS S3

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **API Gateway**: Nginx
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (EKS, RDS, ElastiCache, S3)

### Development Tools
- **Monorepo**: npm workspaces + Turborepo
- **Code Quality**: ESLint, Prettier, Husky
- **Testing**: Jest + Testing Library
- **Type Safety**: TypeScript strict mode
- **Documentation**: Storybook for UI components

## 📂 Project Structure

```
e-commerce/
├── apps/                          # Frontend applications
│   ├── web/                       # Customer web app (Next.js)
│   ├── admin/                     # Admin dashboard (Next.js)
│   └── mobile/                    # Mobile app (React Native)
├── services/                      # Backend microservices
│   ├── auth-service/              # Authentication & authorization
│   ├── user-service/              # User management
│   ├── product-service/           # Product catalog
│   ├── order-service/             # Order management
│   ├── payment-service/           # Payment processing
│   ├── cart-service/              # Shopping cart
│   ├── inventory-service/         # Inventory management
│   ├── search-service/            # Search & filtering
│   ├── notification-service/      # Notifications
│   ├── analytics-service/         # Analytics & reporting
│   ├── review-service/            # Reviews & ratings
│   └── shipping-service/          # Shipping & fulfillment
├── packages/                      # Shared packages
│   ├── ui/                        # Shared UI components
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Utility functions
│   ├── config/                    # Configuration management
│   └── database/                  # Database schemas & migrations
├── infrastructure/                # Infrastructure as Code
│   ├── kubernetes/                # K8s manifests
│   ├── terraform/                 # Terraform configs
│   └── docker/                    # Docker configs
├── docs/                          # Documentation
└── tools/                         # Development tools
```

## 🛠 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd e-commerce
   ```

2. **Run setup script**
   ```bash
   chmod +x scripts/setup-dev.sh
   ./scripts/setup-dev.sh
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Access the applications**
   - Web App: http://localhost:3000
   - Admin Dashboard: http://localhost:3001
   - API Gateway: http://localhost:8080

### Manual Setup

If you prefer manual setup:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build shared packages**
   ```bash
   npm run build --workspace=@ecommerce/types
   npm run build --workspace=@ecommerce/utils
   npm run build --workspace=@ecommerce/config
   npm run build --workspace=@ecommerce/ui
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start infrastructure**
   ```bash
   docker-compose up -d postgres redis elasticsearch kafka
   ```

5. **Start services**
   ```bash
   npm run services:start  # Start all microservices
   npm run apps:start      # Start frontend applications
   ```

## 📜 Available Scripts

### Root Level
- `npm run dev` - Start all services in development mode
- `npm run build` - Build all packages and services
- `npm run test` - Run tests across all packages
- `npm run lint` - Run linting across all packages
- `npm run type-check` - Run TypeScript checks
- `npm run clean` - Clean all build artifacts

### Docker Commands
- `npm run docker:build` - Build Docker images
- `npm run docker:up` - Start all services with Docker
- `npm run docker:down` - Stop all Docker services

### Kubernetes Commands
- `npm run k8s:deploy` - Deploy to Kubernetes
- `kubectl apply -f infrastructure/kubernetes/` - Manual K8s deployment

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://ecommerce:password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# External Services
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Optional Services
ELASTICSEARCH_URL=http://localhost:9200
KAFKA_BROKERS=localhost:9092
SENTRY_DSN=...
```

### Service Ports

- Auth Service: 3001
- Product Service: 3002
- Order Service: 3003
- Payment Service: 3004
- Cart Service: 3005
- Inventory Service: 3006
- Search Service: 3007
- Notification Service: 3008

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific workspace
npm run test --workspace=@ecommerce/auth-service

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## 📊 Monitoring & Observability

### Health Checks
- Service health: `http://localhost:PORT/health`
- API Gateway: `http://localhost:8080/health`

### Metrics & Logs
- Prometheus metrics: Available on each service
- Structured logging with correlation IDs
- Distributed tracing with Jaeger (when configured)

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Staging
```bash
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up
```

### Production with Kubernetes
```bash
kubectl apply -f infrastructure/kubernetes/
```

### AWS EKS Deployment
1. Setup EKS cluster
2. Configure kubectl
3. Apply manifests: `kubectl apply -f infrastructure/kubernetes/`

## 📈 Performance Features

### Scalability
- Horizontal Pod Autoscaling (HPA)
- Database connection pooling
- Redis caching layer
- CDN for static assets
- Image optimization

### Caching Strategy
- Application-level caching
- Redis for session/cart data
- Database query result caching
- API response caching
- Static asset caching via CDN

### Rate Limiting
- API Gateway rate limiting
- Per-service rate limiting
- User-based rate limits
- IP-based rate limits

## 🔐 Security Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation with Zod schemas
- SQL injection prevention
- XSS protection
- CSRF protection
- Security headers
- API rate limiting
- Secrets management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

- Documentation: Check the `/docs` folder
- Issues: Open GitHub issues
- Discussions: GitHub Discussions

## 🗺 Roadmap

### Phase 1 (Current)
- ✅ Monorepo setup
- ✅ Core microservices
- ✅ Frontend applications
- ✅ Docker configuration
- ✅ Kubernetes manifests

### Phase 2 (Next)
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] Machine learning recommendations
- [ ] Multi-tenant support
- [ ] International markets support

### Phase 3 (Future)
- [ ] Advanced inventory management
- [ ] Vendor marketplace
- [ ] Advanced reporting
- [ ] AI-powered features