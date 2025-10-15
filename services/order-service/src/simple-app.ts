import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Order Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      orders: '/api/orders',
      cart: '/api/cart'
    }
  });
});

// Basic order endpoints
app.get('/api/orders', (req, res) => {
  res.json({ 
    message: 'Get orders endpoint - Coming soon',
    service: 'order-service',
    data: []
  });
});

app.post('/api/orders', (req, res) => {
  res.json({ 
    message: 'Create order endpoint - Coming soon',
    service: 'order-service'
  });
});

app.get('/api/orders/:id', (req, res) => {
  res.json({ 
    message: `Get order ${req.params.id} endpoint - Coming soon`,
    service: 'order-service'
  });
});

// Basic cart endpoints
app.get('/api/cart', (req, res) => {
  res.json({ 
    message: 'Get cart endpoint - Coming soon',
    service: 'order-service',
    data: { items: [], total: 0 }
  });
});

app.post('/api/cart/add', (req, res) => {
  res.json({ 
    message: 'Add to cart endpoint - Coming soon',
    service: 'order-service'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;