import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { config, validateConfig } from './config';
import { EmailController } from './controllers/emailController';
import { createEmailRoutes } from './routes/email';
import { EmailQueue } from './queue/EmailQueue';
import { SMTPProvider } from './providers/SMTPProvider';
import { HandlebarsTemplateEngine, TemplateManager } from './templates/engine';

// Load environment variables
dotenv.config();

// Validate configuration
validateConfig();

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet({
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
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // Cache preflight for 24 hours
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Initialize email provider
const emailProvider = new SMTPProvider();

// Initialize template engine and manager
const templateEngine = new HandlebarsTemplateEngine();
const templatesDir = path.join(__dirname, 'templates');
const templateManager = new TemplateManager(templateEngine, templatesDir);

// Initialize email queue
const emailQueue = new EmailQueue(emailProvider, templateManager);

// Initialize email controller
const emailController = new EmailController(emailQueue);

// Load template partials
templateManager.loadPartials().catch(console.error);

// Routes
app.use('/api/v1/email', createEmailRoutes(emailController));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Jequex Email Service',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'email-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? error.message : 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close email queue
    await emailQueue.close();
    console.log('Email queue closed');
    
    // Close server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 30 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 Email Service started successfully!
   
📧 Service: Jequex Email Service
🌐 Environment: ${config.nodeEnv}
🚪 Port: ${PORT}
📬 Email Provider: ${config.email.provider}
🔄 Queue: Redis-based Bull queue
📋 Templates: Handlebars with MJML support
   
🏥 Health Check: http://localhost:${PORT}/health
📚 API Endpoints: http://localhost:${PORT}/api/v1/email
   
🛑 Press Ctrl+C to stop the server
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;