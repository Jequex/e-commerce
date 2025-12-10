# Store Service

The Store Service is a comprehensive microservice for managing stores in the e-commerce platform. It handles store registration, management, reviews, analytics, and all store-related operations.

## Features

### 🏪 Store Management
- **Store Registration**: Complete store setup with business information
- **Store Updates**: Modify store details, settings, and status
- **Store Categories**: Hierarchical categorization system
- **Store Types**: Physical, online, or hybrid store support
- **Store Status**: Active, inactive, pending approval, suspended, closed

### 📍 Location Management
- **Multiple Addresses**: Support for multiple store locations
- **Geolocation**: Latitude/longitude coordinates
- **Delivery Zones**: Configurable delivery radius
- **Address Types**: Primary, warehouse, pickup points

### 🕐 Business Hours
- **Operating Hours**: Set hours for each day of the week
- **Holiday Hours**: Special hours for holidays
- **Closed Days**: Flexible closure management
- **Time Zone Support**: Proper time handling

### 👥 Staff Management
- **Staff Roles**: Owner, manager, cashier, sales associate, inventory manager
- **Permissions**: Role-based access control
- **Staff Details**: Salary, commission, hire/termination dates
- **User Integration**: Links with user management system

### ⭐ Reviews & Ratings
- **Customer Reviews**: User feedback and ratings (1-5 stars)
- **Review Moderation**: Admin approval system
- **Verified Reviews**: Order-based verification
- **Response System**: Admin responses to reviews
- **Rating Aggregation**: Automatic average rating calculation

### 📊 Analytics & Reporting
- **Sales Metrics**: Revenue, orders, average order value
- **Traffic Analytics**: Page views, unique visitors, conversion rates
- **Customer Metrics**: New vs returning customers
- **Performance Tracking**: Historical data and trends
- **Custom Reports**: Flexible date ranges and filtering

### 🔒 Security Features
- **JWT Authentication**: Secure API access
- **Role-based Authorization**: Granular permissions
- **Rate Limiting**: Multiple tiers of rate protection
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries

## API Endpoints

### Public Endpoints
```
GET  /api/v1/stores              # List stores with filtering
GET  /api/v1/stores/:id          # Get store details
GET  /api/v1/stores/:id/reviews  # Get store reviews
GET  /api/v1/stores/categories/list # Get store categories
```

### Protected Endpoints (Authentication Required)
```
POST   /api/v1/stores                    # Create new store
PUT    /api/v1/stores/:id                # Update store
DELETE /api/v1/stores/:id                # Delete store
POST   /api/v1/stores/:id/addresses      # Add store address
PUT    /api/v1/stores/:id/hours          # Update business hours
POST   /api/v1/stores/:id/staff          # Add staff member
POST   /api/v1/stores/:id/reviews        # Add review
GET    /api/v1/stores/:id/analytics      # Get analytics (owner/admin)
```

## Database Schema

### Core Tables
- **stores**: Main store information
- **store_categories**: Hierarchical store categories
- **store_addresses**: Multiple addresses per store
- **store_hours**: Business hours configuration
- **store_staff**: Staff members and roles
- **store_reviews**: Customer reviews and ratings
- **store_analytics**: Performance metrics and analytics

### Key Features
- **UUID Primary Keys**: For security and scalability
- **JSONB Metadata**: Flexible data storage
- **Soft Deletes**: Preserve data integrity
- **Audit Fields**: Creation and update timestamps
- **Relationship Integrity**: Foreign key constraints

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Docker (optional)

### Installation

1. **Clone and install dependencies**:
```bash
cd services/store-service
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up the database**:
```bash
# Check database connection
npm run db:check

# Run migrations
npm run migrate

# Check table status
npm run db:status
```

4. **Start the service**:
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Docker Setup

```bash
# Build image
docker build -t store-service .

# Run container
docker run -p 3007:3007 --env-file .env store-service
```

## Development

### Available Scripts
```bash
npm run dev          # Start in development mode
npm run build        # Build for production
npm start           # Start production server
npm run type-check   # TypeScript type checking
npm run lint         # ESLint code linting
npm run test         # Run tests
npm run migrate      # Run database migrations
npm run db:check     # Check database connection
npm run db:status    # Check table status
```

### Code Structure
```
src/
├── config/          # Database and service configuration
├── controllers/     # Business logic and request handlers
├── middleware/      # Authentication, validation, error handling
├── migrations/      # Database migration scripts
├── routes/          # API route definitions
├── schema/          # Database schema and validation
├── utils/           # Helper functions and utilities
└── app.ts          # Main application entry point
```

## Configuration

### Environment Variables

#### Server Configuration
- `PORT`: Service port (default: 3007)
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Allowed CORS origins

#### Database Configuration
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

#### Security Configuration
- `JWT_SECRET`: JWT signing secret
- `RATE_LIMIT_WINDOW_MS`: Rate limit window
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

### Rate Limiting
- **General**: 100 requests per 15 minutes
- **Strict**: 10 requests per 15 minutes (resource-intensive operations)
- **Create**: 5 store creations per hour

## API Documentation

### Request/Response Format
All API responses follow this format:
```json
{
  "message": "Success message",
  "data": { /* response data */ },
  "pagination": { /* pagination info (if applicable) */ }
}
```

### Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [ /* validation errors (if applicable) */ ]
}
```

### Pagination
```json
{
  "page": 1,
  "limit": 20,
  "totalCount": 100,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": false
}
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### API Testing
Use the included Postman collection or test with curl:

```bash
# Health check
curl http://localhost:3007/health

# Get stores
curl http://localhost:3007/api/v1/stores

# Create store (requires authentication)
curl -X POST http://localhost:3007/api/v1/stores \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Store","slug":"my-store","type":"physical"}'
```

## Monitoring & Health Checks

### Health Endpoints
- `GET /health`: Basic health check
- `GET /ready`: Readiness probe (includes database check)
- `GET /live`: Liveness probe

### Logging
The service uses structured logging with different levels:
- **Error**: Critical errors and exceptions
- **Warn**: Warning conditions
- **Info**: General information
- **Debug**: Detailed debugging information

### Metrics
Key metrics tracked:
- Request count and response times
- Database connection pool status
- Error rates and types
- Store creation/update rates

## Security Considerations

### Authentication
- JWT tokens required for protected endpoints
- Token validation and expiration checking
- Role-based access control

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection headers
- Rate limiting to prevent abuse

### Privacy
- Sensitive data filtering in responses
- Audit logging for data access
- GDPR compliance considerations

## Performance Optimization

### Database Optimization
- Proper indexing on frequently queried columns
- Query optimization and monitoring
- Connection pooling
- Prepared statements

### Caching Strategy
- Response caching for public endpoints
- Database query result caching
- Static asset caching

### Scalability
- Horizontal scaling support
- Load balancer compatibility
- Database read replicas support
- Microservice architecture

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials
   - Verify database server is running
   - Check network connectivity

2. **Authentication Errors**
   - Verify JWT_SECRET configuration
   - Check token expiration
   - Validate token format

3. **Validation Errors**
   - Check request payload format
   - Verify required fields
   - Validate data types

### Debug Mode
Enable debug logging:
```bash
NODE_ENV=development npm run dev
```

### Database Debugging
Check table status:
```bash
npm run db:status
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive JSDoc comments

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

---

**Store Service** - Part of the Jequex E-commerce Platform