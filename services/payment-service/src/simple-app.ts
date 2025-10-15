import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3004;

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
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Payment Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      payments: '/api/payments',
      webhooks: '/api/webhooks'
    }
  });
});

// Basic payment endpoints
app.get('/api/payments', (req, res) => {
  res.json({ 
    message: 'Get payments endpoint - Coming soon',
    service: 'payment-service',
    data: []
  });
});

app.post('/api/payments/process', (req, res) => {
  res.json({ 
    message: 'Process payment endpoint - Coming soon',
    service: 'payment-service'
  });
});

app.get('/api/payments/:id', (req, res) => {
  res.json({ 
    message: `Get payment ${req.params.id} endpoint - Coming soon`,
    service: 'payment-service'
  });
});

// Webhook endpoints
app.post('/api/webhooks/stripe', (req, res) => {
  res.json({ 
    message: 'Stripe webhook endpoint - Coming soon',
    service: 'payment-service'
  });
});

app.post('/api/webhooks/paypal', (req, res) => {
  res.json({ 
    message: 'PayPal webhook endpoint - Coming soon',
    service: 'payment-service'
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
  console.log(`🚀 Payment Service running on port ${PORT}`);
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