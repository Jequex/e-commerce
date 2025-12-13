# Roles & Permissions - Quick Reference

## 🚀 Quick Start

### Run Seed Script
```bash
docker-compose -f docker-compose.dev.yml exec store-service npm run seed
```

### API Base URL
```
http://localhost:3007/api/v1
```

## 📋 Available Endpoints

### Roles
```
GET    /roles                              - List all roles
POST   /roles                              - Create new role
GET    /roles/:id                          - Get role details
PUT    /roles/:id                          - Update role
DELETE /roles/:id                          - Delete role
POST   /roles/:id/permissions              - Assign permission
DELETE /roles/:id/permissions/:permissionId - Remove permission
```

### Permissions
```
GET    /permissions                 - List all permissions
POST   /permissions                 - Create new permission
GET    /permissions/:id             - Get permission details
PUT    /permissions/:id             - Update permission
DELETE /permissions/:id             - Delete permission
GET    /permissions/by-resource     - Group by resource
```

## 🔑 Authentication

All endpoints require JWT bearer token:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3007/api/v1/roles
```

## 👥 Default Roles (5 total)

| Role | Slug | Permissions | System |
|------|------|-------------|--------|
| Store Owner | store_owner | All (21) | ✅ |
| Store Manager | store_manager | 16 | ✅ |
| Sales Associate | sales_associate | 6 | ✅ |
| Inventory Manager | inventory_manager | 6 | ✅ |
| Customer Support | customer_support | 7 | ✅ |

## 🔐 Permission Categories (21 total)

### Stores (5)
- `stores.view` - View store information
- `stores.create` - Create new stores
- `stores.update` - Update store information
- `stores.delete` - Delete stores
- `stores.manage_staff` - Manage store staff

### Products (5)
- `products.view` - View products
- `products.create` - Create products
- `products.update` - Update products
- `products.delete` - Delete products
- `products.manage_inventory` - Manage inventory

### Orders (5)
- `orders.view` - View orders
- `orders.create` - Create orders
- `orders.update` - Update order status
- `orders.cancel` - Cancel orders
- `orders.refund` - Process refunds

### Customers (2)
- `customers.view` - View customer information
- `customers.manage` - Manage customer accounts

### Analytics (2)
- `analytics.view` - View analytics
- `analytics.export` - Export reports

### Settings & Roles (2)
- `settings.manage` - Manage settings
- `roles.manage` - Manage roles/permissions

## 💡 Common Operations

### Create a Role
```bash
curl -X POST http://localhost:3007/api/v1/roles \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Role",
    "slug": "custom_role",
    "description": "Description here"
  }'
```

### Assign Permission to Role
```bash
curl -X POST http://localhost:3007/api/v1/roles/ROLE_ID/permissions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"permissionId": "PERMISSION_ID"}'
```

### List All Permissions
```bash
curl http://localhost:3007/api/v1/permissions \
  -H "Authorization: Bearer TOKEN"
```

### Filter Permissions by Resource
```bash
curl "http://localhost:3007/api/v1/permissions?resource=stores" \
  -H "Authorization: Bearer TOKEN"
```

### Get Permissions Grouped by Resource
```bash
curl http://localhost:3007/api/v1/permissions/by-resource \
  -H "Authorization: Bearer TOKEN"
```

## 📊 Database Stats

After seeding:
- **Roles**: 5 (all system roles)
- **Permissions**: 21
- **Role-Permission Mappings**: 53

## ⚠️ Important Notes

1. **System Roles**: Cannot be deleted or have their slug/name modified
2. **Unique Slugs**: Role and permission slugs must be unique
3. **Authentication**: All endpoints require valid JWT token
4. **Validation**: All requests are validated with Zod schemas

## 🔧 Troubleshooting

### Check Service Health
```bash
curl http://localhost:3007/health
```

### View Logs
```bash
docker-compose -f docker-compose.dev.yml logs -f store-service
```

### Verify Database
```bash
docker-compose -f docker-compose.dev.yml exec postgres \
  psql -U ecommerce -d ecommerce_store \
  -c "SELECT COUNT(*) FROM roles;"
```

### Re-run Seed
```bash
docker-compose -f docker-compose.dev.yml exec store-service npm run seed
```

## 📖 Full Documentation

See `ROLES-PERMISSIONS-API.md` for:
- Detailed API reference
- Error codes
- Usage examples
- Best practices
- Integration guide

## 🎯 Implementation Details

- **Location**: `services/store-service/src/`
- **Controllers**: `controllers/roleController.ts`, `controllers/permissionController.ts`
- **Routes**: `routes/role.routes.ts`, `routes/permission.routes.ts`
- **Seed**: `utils/seed.ts`
- **Schema**: `schema/store.ts` (tables already created via migrations)

## ✅ Status

- ✅ All TypeScript errors resolved
- ✅ Service running on port 3007
- ✅ Database seeded successfully
- ✅ 13 API endpoints active
- ✅ Authentication middleware configured
- ✅ Validation schemas in place
- ✅ Documentation complete

## 🚦 Next Steps

1. ✅ Seed database (completed)
2. ⏭️ Test endpoints with Postman/curl
3. ⏭️ Integrate with frontend
4. ⏭️ Add to admin dashboard
5. ⏭️ Implement permission checks in other services
