# Email Service

A comprehensive email microservice for the Jequex e-commerce platform, built with TypeScript, Express, and Redis-based queuing system.

## Features

- 📧 **Multi-Provider Support**: SMTP, SendGrid, and AWS SES
- 🎯 **Template Engine**: Handlebars with MJML support for responsive emails
- 🔄 **Queue System**: Redis-based Bull queue for reliable email delivery
- 📊 **Rate Limiting**: Built-in rate limiting for API protection
- 🛡️ **Security**: Helmet, CORS, and input validation
- 📋 **Validation**: Zod schemas for type-safe request validation
- 🏥 **Health Checks**: Comprehensive health monitoring endpoints
- 🐳 **Docker Support**: Production and development containerization
- 📈 **Monitoring**: Job status tracking and queue statistics

## Email Types Supported

- Welcome emails
- Password reset emails
- Order confirmations
- Custom template-based emails
- Bulk email campaigns

## API Endpoints

### Email Operations
- `POST /api/v1/email/send` - Send single email
- `POST /api/v1/email/send-bulk` - Send bulk emails
- `POST /api/v1/email/send-template` - Send template-based email

### Job Management
- `GET /api/v1/email/jobs/:jobId` - Get job status
- `DELETE /api/v1/email/jobs/:jobId` - Cancel job

### Queue Management
- `GET /api/v1/email/queue/stats` - Get queue statistics
- `POST /api/v1/email/queue/pause` - Pause queue
- `POST /api/v1/email/queue/resume` - Resume queue
- `POST /api/v1/email/queue/clean` - Clean completed/failed jobs

### System
- `GET /health` - Health check
- `GET /` - Service information

## Quick Start

### Prerequisites

- Node.js 18+
- Redis server
- Email provider credentials (SMTP, SendGrid, or AWS SES)

### Installation

1. **Clone and navigate to the email service:**
   ```bash
   cd services/email-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Redis server:**
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine

   # Or install locally and start
   redis-server
   ```

5. **Start the service:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

### Docker Deployment

1. **Development:**
   ```bash
   docker build -f Dockerfile.dev -t email-service:dev .
   docker run -p 3005:3005 --env-file .env email-service:dev
   ```

2. **Production:**
   ```bash
   docker build -f Dockerfile -t email-service:prod .
   docker run -p 3005:3005 --env-file .env email-service:prod
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3005` |
| `NODE_ENV` | Environment | `development` |
| `EMAIL_PROVIDER` | Email provider (smtp/sendgrid/ses) | `smtp` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

### Email Providers

#### SMTP Configuration
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### SendGrid Configuration
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
```

#### AWS SES Configuration
```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Email Templates

The service includes pre-built templates for common email types:

- `welcome.hbs` - Welcome/verification emails
- `password-reset.hbs` - Password reset emails
- `order-confirmation.hbs` - Order confirmation emails

### Template Variables

Templates support Handlebars variables and helpers:

```handlebars
{{firstName}}
{{companyName}}
{{formatDate orderDate 'medium'}}
{{formatCurrency total 'USD'}}
```

### Custom Templates

Add new templates to the `src/templates/` directory using Handlebars syntax.

## API Usage Examples

### Send Single Email

```bash
curl -X POST http://localhost:3005/api/v1/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"email": "user@example.com", "name": "John Doe"}],
    "subject": "Welcome to Jequex!",
    "template": "welcome",
    "templateData": {
      "firstName": "John",
      "companyName": "Jequex",
      "verificationUrl": "https://app.jequex.com/verify/token123"
    }
  }'
```

### Send Bulk Email

```bash
curl -X POST http://localhost:3005/api/v1/email/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "template": "welcome",
    "subject": "Welcome to Jequex!",
    "recipients": [
      {
        "email": "user1@example.com",
        "name": "User One",
        "templateData": {"firstName": "User One"}
      },
      {
        "email": "user2@example.com",
        "name": "User Two",
        "templateData": {"firstName": "User Two"}
      }
    ]
  }'
```

### Check Job Status

```bash
curl http://localhost:3005/api/v1/email/jobs/job-id-here
```

## Queue Management

The service uses Bull queue with Redis for reliable email processing:

- **Retry Logic**: Failed jobs are automatically retried with exponential backoff
- **Priority Handling**: Support for high, normal, and low priority emails
- **Scheduling**: Support for scheduled email delivery
- **Monitoring**: Real-time job status and queue statistics

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm test` - Run tests
- `npm run type-check` - TypeScript type checking

### Project Structure

```
src/
├── app.ts                 # Main application file
├── config/               # Configuration management
├── controllers/          # Request handlers
├── middleware/           # Express middleware
├── providers/            # Email provider implementations
├── queue/               # Queue management
├── routes/              # API routes
├── schema/              # Zod validation schemas
├── templates/           # Email templates
└── types/               # TypeScript type definitions
```

## Monitoring and Debugging

### Health Checks

```bash
# Service health
curl http://localhost:3005/health

# Queue statistics
curl http://localhost:3005/api/v1/email/queue/stats
```

### Logs

The service provides structured logging:
- Request/response logs (Morgan)
- Queue job logs
- Error tracking
- Performance metrics

## Production Considerations

1. **Security**: Use strong Redis passwords and secure SMTP credentials
2. **Scaling**: Deploy multiple instances behind a load balancer
3. **Monitoring**: Set up alerts for failed jobs and queue backlogs
4. **Backup**: Regular Redis backups for queue persistence
5. **Rate Limiting**: Adjust rate limits based on your email provider's limits

## License

MIT License - see LICENSE file for details.