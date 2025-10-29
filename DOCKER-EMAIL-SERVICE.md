# Docker Compose Updates for Email Service

## Changes Made

### 1. Added Email Service to Both Docker Compose Files

#### Production (`docker-compose.yml`)
- Added `email-service` container configuration
- Exposed on port `3006:3005` (to avoid conflicts)
- Uses production Dockerfile
- Configured with SMTP email provider by default

#### Development (`docker-compose.dev.yml`)
- Added `email-service` container configuration
- Exposed on port `3005:3005`
- Uses development Dockerfile with hot reload
- Includes volume mounts for development

### 2. Updated Port Mappings

| Service | Production Port | Development Port |
|---------|----------------|------------------|
| Web App | 3000:3000 | 3000:3000 |
| Auth Service | 3001:3001 | 3001:3001 |
| Product Service | 3002:3002 | 3002:3002 |
| Order Service | 3003:3003 | 3003:3003 |
| Payment Service | 3004:3004 | 3004:3004 |
| **Email Service** | **3006:3005** | **3005:3005** |
| Admin App | 3007:3001 | 3006:3000 |

### 3. Updated Nginx Configuration

Added email service routing to the API gateway:
- Upstream: `email_service` pointing to `email-service:3005`
- Route: `/api/email/` proxies to email service
- Rate limiting: 10 requests per second burst

### 4. Database Configuration

Added email service database:
- Database: `ecommerce_emails`
- User: `email_user` with password `email_password`
- Grants: Full privileges for email service operations

### 5. Environment Variables

Created `.env.docker` template with required email service variables:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_ADDRESS=noreply@jequex.com
```

## Quick Start

### 1. Set Up Environment Variables

```bash
# Copy the template
cp .env.docker .env

# Edit with your email credentials
nano .env
```

### 2. Start Development Environment

```bash
# Start all services including email service
docker-compose -f docker-compose.dev.yml up -d

# Or start only email service and dependencies
docker-compose -f docker-compose.dev.yml up -d redis email-service
```

### 3. Start Production Environment

```bash
# Build and start all services
docker-compose up -d

# Or start only email service and dependencies
docker-compose up -d redis email-service
```

## Service Endpoints

### Email Service Direct Access
- **Development**: http://localhost:3005
- **Production**: http://localhost:3006

### Email Service via API Gateway
- **Both**: http://localhost:8080/api/email/

### Available Email API Endpoints
- `POST /api/email/send` - Send single email
- `POST /api/email/send-bulk` - Send bulk emails
- `POST /api/email/send-template` - Send template-based email
- `GET /api/email/queue/stats` - Queue statistics
- `GET /api/email/health` - Health check

## Email Provider Configuration

### SMTP (Default)
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### SendGrid
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
```

### AWS SES
```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Redis Configuration

The email service uses Redis for:
- Email queue management
- Job processing and retry logic
- Rate limiting state

**Configuration:**
- Host: `redis` (container name)
- Port: `6379`
- Database: `1` (separate from other services)

## Monitoring and Debugging

### Check Service Status
```bash
# View all services
docker-compose ps

# View email service logs
docker-compose logs -f email-service

# Check email service health
curl http://localhost:3005/health
```

### Queue Management
```bash
# Check queue statistics
curl http://localhost:3005/api/v1/email/queue/stats

# Pause queue processing
curl -X POST http://localhost:3005/api/v1/email/queue/pause

# Resume queue processing
curl -X POST http://localhost:3005/api/v1/email/queue/resume
```

### Testing Email Sending
```bash
# Send a test email
curl -X POST http://localhost:8080/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"email": "test@example.com", "name": "Test User"}],
    "subject": "Test Email",
    "template": "welcome",
    "templateData": {
      "firstName": "Test",
      "companyName": "Jequex"
    }
  }'
```

## Troubleshooting

### Common Issues

1. **Email service fails to start**
   - Check Redis is running: `docker-compose ps redis`
   - Verify environment variables in `.env` file
   - Check email provider credentials

2. **Emails not sending**
   - Verify SMTP credentials are correct
   - Check email service logs: `docker-compose logs email-service`
   - Ensure Redis is accessible

3. **Port conflicts**
   - Email service uses ports 3005 (dev) and 3006 (prod)
   - Admin app moved to port 3006 (dev) and 3007 (prod)
   - Update any hardcoded port references

4. **Rate limiting issues**
   - Default: 100 requests per 15 minutes
   - Adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`
   - Check nginx rate limiting configuration

## Next Steps

1. **Configure Email Templates**: Customize email templates in `services/email-service/src/templates/`
2. **Set Up Monitoring**: Implement monitoring for email delivery rates and queue health
3. **Production Deployment**: Configure proper email provider credentials and domain settings
4. **Integration**: Connect other services to use the email service for notifications