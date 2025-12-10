import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { storeRoutes } from './routes/store';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Logging middleware
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Global rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'store-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Readiness probe for Kubernetes
app.get('/ready', async (req, res) => {
  try {
    const isDbConnected = await testConnection();
    
    if (isDbConnected) {
      res.status(200).json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness probe for Kubernetes
app.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1/stores', storeRoutes);

// API documentation route
app.get('/api/v1', (req, res) => {
  res.json({
    service: 'Store Service API',
    version: 'v1',
    description: 'Comprehensive store management API for e-commerce platform',
    endpoints: {
      stores: {
        'GET /api/v1/stores': 'List all stores with filtering and pagination',
        'POST /api/v1/stores': 'Create a new store (authenticated)',
        'GET /api/v1/stores/:id': 'Get store details by ID',
        'PUT /api/v1/stores/:id': 'Update store (authenticated, owner/admin only)',
        'DELETE /api/v1/stores/:id': 'Delete store (authenticated, owner/admin only)',
      },
      addresses: {
        'POST /api/v1/stores/:id/addresses': 'Add store address (authenticated)',
      },
      hours: {
        'PUT /api/v1/stores/:id/hours': 'Update store business hours (authenticated)',
      },
      staff: {
        'POST /api/v1/stores/:id/staff': 'Add store staff member (authenticated)',
      },
      reviews: {
        'GET /api/v1/stores/:id/reviews': 'Get store reviews',
        'POST /api/v1/stores/:id/reviews': 'Add store review (authenticated)',
      },
      analytics: {
        'GET /api/v1/stores/:id/analytics': 'Get store analytics (authenticated, owner/admin only)',
      },
      categories: {
        'GET /api/v1/stores/categories/list': 'Get store categories',
      }
    },
    authentication: 'Bearer token required for protected endpoints',
    rateLimit: {
      general: '100 requests per 15 minutes',
      strict: '10 requests per 15 minutes',
      create: '5 requests per hour'
    }
  });
});

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const startServer = async () => {
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Store Service running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;