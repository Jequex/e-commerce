# Roles and Permissions API Documentation

## Overview

The Store Service now includes comprehensive Role-Based Access Control (RBAC) APIs for managing roles, permissions, and staff access control.

## Database Schema

### Tables

1. **permissions** - Defines granular permissions for resources
2. **roles** - Defines user roles with associated permissions
3. **role_permissions** - Junction table linking roles to permissions
4. **staff_permissions** - Custom permissions for individual staff members

### Default Roles

The system includes 5 predefined system roles:

- **Store Owner** - Full access to all store operations
- **Store Manager** - Can manage store operations and staff
- **Sales Associate** - Can handle sales and customer interactions
- **Inventory Manager** - Can manage product inventory
- **Customer Support** - Can assist customers and view orders

## API Endpoints

### Roles API

#### 1. Create Role
```http
POST /api/v1/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Custom Manager",
  "slug": "custom_manager",
  "description": "Custom role for specific operations",
  "isSystem": false
}
```

**Response:**
```json
{
  "message": "Role created successfully",
  "role": {
    "id": "uuid",
    "name": "Custom Manager",
    "slug": "custom_manager",
    "description": "Custom role for specific operations",
    "isSystem": false,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 2. Get All Roles
```http
GET /api/v1/roles
Authorization: Bearer <token>
```

**Response:**
```json
{
  "roles": [
    {
      "id": "uuid",
      "name": "Store Owner",
      "slug": "store_owner",
      "description": "Full access to store management",
      "isSystem": true,
      "isActive": true
    }
  ],
  "count": 5
}
```

#### 3. Get Role by ID
```http
GET /api/v1/roles/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "role": {
    "id": "uuid",
    "name": "Store Manager",
    "slug": "store_manager",
    "permissions": [
      {
        "id": "uuid",
        "name": "View Stores",
        "slug": "stores.view",
        "resource": "stores",
        "action": "view"
      }
    ]
  }
}
```

#### 4. Update Role
```http
PUT /api/v1/roles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Role Name",
  "description": "Updated description",
  "isActive": true
}
```

**Note:** System roles cannot be modified.

#### 5. Delete Role
```http
DELETE /api/v1/roles/:id
Authorization: Bearer <token>
```

**Note:** System roles cannot be deleted.

#### 6. Assign Permission to Role
```http
POST /api/v1/roles/:id/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionId": "uuid"
}
```

#### 7. Remove Permission from Role
```http
DELETE /api/v1/roles/:id/permissions/:permissionId
Authorization: Bearer <token>
```

### Permissions API

#### 1. Create Permission
```http
POST /api/v1/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Export Reports",
  "slug": "reports.export",
  "description": "Can export various reports",
  "resource": "reports",
  "action": "export",
  "isActive": true
}
```

#### 2. Get All Permissions
```http
GET /api/v1/permissions
Authorization: Bearer <token>
```

**Query Parameters:**
- `resource` - Filter by resource name
- `action` - Filter by action name
- `search` - Search in name and description

**Example:**
```http
GET /api/v1/permissions?resource=stores&action=view
GET /api/v1/permissions?search=order
```

#### 3. Get Permission by ID
```http
GET /api/v1/permissions/:id
Authorization: Bearer <token>
```

#### 4. Update Permission
```http
PUT /api/v1/permissions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Permission Name",
  "description": "Updated description",
  "isActive": true
}
```

#### 5. Delete Permission
```http
DELETE /api/v1/permissions/:id
Authorization: Bearer <token>
```

#### 6. Get Permissions Grouped by Resource
```http
GET /api/v1/permissions/by-resource
Authorization: Bearer <token>
```

**Response:**
```json
{
  "permissions": {
    "stores": [
      {
        "id": "uuid",
        "name": "View Stores",
        "slug": "stores.view",
        "action": "view"
      }
    ],
    "products": [...],
    "orders": [...]
  },
  "resources": ["stores", "products", "orders"]
}
```

## Permission Structure

Permissions follow a resource-action pattern:

### Available Resources
- `stores` - Store management operations
- `products` - Product management operations
- `orders` - Order management operations
- `customers` - Customer management operations
- `analytics` - Analytics and reporting
- `settings` - System settings
- `roles` - Role and permission management

### Common Actions
- `view` - Read access to resources
- `create` - Create new resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `manage` - Full management access

### Permission Examples
- `stores.view` - Can view store information
- `products.create` - Can create new products
- `orders.update` - Can update order status
- `analytics.export` - Can export analytics reports
- `roles.manage` - Can manage roles and permissions

## Default Permission Mappings

### Store Owner
All permissions (21 total)

### Store Manager
- All store operations (except delete)
- Product management
- Order management (except refund)
- Customer management
- Analytics access

### Sales Associate
- View stores and products
- Create and update orders
- View customer information

### Inventory Manager
- View stores
- Full product and inventory management
- View analytics

### Customer Support
- View stores, products, orders
- Update orders
- Manage customer accounts

## Seeding Data

To populate the database with default roles and permissions:

```bash
# Inside the store-service container
npm run seed

# Or from host
docker-compose -f docker-compose.dev.yml exec store-service npm run seed
```

This will create:
- 21 predefined permissions
- 5 system roles
- 53 role-permission assignments

## Authentication

All endpoints require authentication via JWT bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

The JWT token should include:
- `userId` - User identifier
- `email` - User email
- `role` - User role
- `permissions` - Array of permission slugs

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "body.name",
      "message": "Required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required",
  "code": "TOKEN_REQUIRED"
}
```

### 403 Forbidden
```json
{
  "error": "Cannot modify system role",
  "code": "SYSTEM_ROLE_MODIFICATION_FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "error": "Role not found",
  "code": "ROLE_NOT_FOUND"
}
```

### 409 Conflict
```json
{
  "error": "Role with this name or slug already exists",
  "code": "ROLE_EXISTS"
}
```

## Usage Examples

### 1. Creating a Custom Role with Permissions

```javascript
// Step 1: Create the role
const roleResponse = await fetch('http://localhost:3007/api/v1/roles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Store Assistant',
    slug: 'store_assistant',
    description: 'Limited store operations'
  })
});

const { role } = await roleResponse.json();

// Step 2: Get available permissions
const permissionsResponse = await fetch(
  'http://localhost:3007/api/v1/permissions?resource=stores',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const { permissions } = await permissionsResponse.json();

// Step 3: Assign permissions to the role
for (const permission of permissions) {
  await fetch(`http://localhost:3007/api/v1/roles/${role.id}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      permissionId: permission.id
    })
  });
}
```

### 2. Checking Role Permissions

```javascript
const roleResponse = await fetch(
  `http://localhost:3007/api/v1/roles/${roleId}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const { role } = await roleResponse.json();

// Check if role has specific permission
const hasPermission = role.permissions.some(
  p => p.slug === 'stores.update'
);
```

### 3. Creating Custom Permissions

```javascript
const response = await fetch('http://localhost:3007/api/v1/permissions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Bulk Import Products',
    slug: 'products.bulk_import',
    description: 'Can import multiple products at once',
    resource: 'products',
    action: 'bulk_import'
  })
});
```

## Integration with Store Staff

When adding staff to a store, you can now assign roles:

```javascript
const response = await fetch(
  `http://localhost:3007/api/v1/stores/${storeId}/staff`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'user-uuid',
      roleId: 'role-uuid', // Assign a role
      canManageProducts: true,
      canManageOrders: true,
      canViewAnalytics: false
    })
  }
);
```

## Best Practices

1. **Use System Roles First** - Start with the 5 predefined roles before creating custom ones
2. **Follow Naming Conventions** - Use descriptive names and consistent slug format (resource.action)
3. **Granular Permissions** - Create specific permissions rather than broad ones
4. **Regular Audits** - Periodically review role-permission assignments
5. **Document Custom Roles** - Keep track of why custom roles were created
6. **Test Permissions** - Verify that permissions work as expected before assigning to users

## Troubleshooting

### Permission Not Working
1. Verify the permission exists in the database
2. Check if the role has the permission assigned
3. Ensure the user's token includes the permission
4. Verify the permission slug matches exactly

### Cannot Delete Role
System roles (isSystem: true) cannot be deleted. Create custom roles for deletable options.

### Duplicate Permission Error
Permission slugs must be unique. Use a different slug or update the existing permission.

## Future Enhancements

- [ ] Permission inheritance and hierarchies
- [ ] Time-based permissions (expiring access)
- [ ] IP-based restrictions
- [ ] Audit logging for permission changes
- [ ] Bulk role assignments
- [ ] Role templates
