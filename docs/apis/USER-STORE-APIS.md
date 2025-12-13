# User Store APIs Documentation

This document describes the new authenticated user store endpoints that allow users to query their store associations, roles, and permissions.

## Overview

These endpoints enable authenticated users to:
- Get all stores where they are staff members
- Get their role in a specific store
- Get their permissions in a specific store
- Get complete consolidated information (store + role + permissions)

## Authentication

All endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer <jwt_token>
```

The user ID is automatically extracted from `req.user.id` in the JWT payload.

## Endpoints

### 1. Get User's Stores

**Endpoint:** `GET /api/v1/stores/user/stores`

**Description:** Returns all stores where the authenticated user is an active staff member, along with their role information.

**Response:**
```json
{
  "stores": [
    {
      "staffId": "uuid",
      "storeId": "uuid",
      "storeName": "Store Name",
      "storeSlug": "store-slug",
      "storeDescription": "Store description",
      "storeType": "retail|wholesale|digital",
      "storeStatus": "active|inactive|suspended",
      "storeLogo": "logo-url",
      "storeBanner": "banner-url",
      "roleId": "uuid",
      "roleName": "Manager",
      "roleSlug": "manager",
      "isActive": true,
      "hiredAt": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - No authentication token
- `500 Internal Server Error` - Server error

---

### 2. Get User's Role in Store

**Endpoint:** `GET /api/v1/stores/user/stores/:storeId/role`

**Description:** Returns the user's role details in a specific store.

**Parameters:**
- `storeId` (path) - UUID of the store

**Response:**
```json
{
  "staff": {
    "staffId": "uuid",
    "storeId": "uuid",
    "storeName": "Store Name",
    "storeSlug": "store-slug",
    "roleId": "uuid",
    "roleName": "Manager",
    "roleSlug": "manager",
    "roleDescription": "Store manager with full access",
    "isSystemRole": false,
    "salary": 5000,
    "commission": 10,
    "isActive": true,
    "hiredAt": "2024-01-15T10:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - No authentication token
- `404 Not Found` - User is not staff in this store
- `500 Internal Server Error` - Server error

---

### 3. Get User's Permissions in Store

**Endpoint:** `GET /api/v1/stores/user/stores/:storeId/permissions`

**Description:** Returns all permissions assigned to the user's role in a specific store.

**Parameters:**
- `storeId` (path) - UUID of the store

**Response:**
```json
{
  "role": {
    "id": "uuid",
    "name": "Manager",
    "slug": "manager"
  },
  "permissions": [
    {
      "id": "uuid",
      "name": "View Products",
      "slug": "products.view",
      "description": "View product listings",
      "resource": "products",
      "action": "view",
      "isActive": true
    },
    {
      "id": "uuid",
      "name": "Create Products",
      "slug": "products.create",
      "description": "Create new products",
      "resource": "products",
      "action": "create",
      "isActive": true
    }
  ],
  "permissionsByResource": {
    "products": [
      {
        "id": "uuid",
        "name": "View Products",
        "slug": "products.view",
        "description": "View product listings",
        "resource": "products",
        "action": "view",
        "isActive": true
      }
    ],
    "orders": [...]
  },
  "permissionSlugs": [
    "products.view",
    "products.create",
    "orders.view",
    "orders.update"
  ],
  "count": 15
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - No authentication token
- `404 Not Found` - User is not staff in this store
- `500 Internal Server Error` - Server error

---

### 4. Get Complete User Store Info

**Endpoint:** `GET /api/v1/stores/user/stores/:storeId/complete`

**Description:** Returns comprehensive information including store details, role, and all permissions in a single response.

**Parameters:**
- `storeId` (path) - UUID of the store

**Response:**
```json
{
  "staff": {
    "id": "uuid",
    "isActive": true,
    "hiredAt": "2024-01-15T10:00:00Z",
    "salary": 5000,
    "commission": 10
  },
  "store": {
    "id": "uuid",
    "name": "My Awesome Store",
    "slug": "my-awesome-store",
    "description": "Best store in town",
    "type": "retail",
    "status": "active",
    "logo": "logo-url",
    "banner": "banner-url",
    "email": "store@example.com",
    "phone": "+1234567890"
  },
  "role": {
    "id": "uuid",
    "name": "Manager",
    "slug": "manager",
    "description": "Store manager with full access",
    "isSystemRole": false
  },
  "permissions": [
    {
      "id": "uuid",
      "name": "View Products",
      "slug": "products.view",
      "description": "View product listings",
      "resource": "products",
      "action": "view"
    }
  ],
  "permissionsByResource": {
    "products": [...],
    "orders": [...],
    "staff": [...]
  },
  "permissionSlugs": [
    "products.view",
    "products.create",
    "orders.view"
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - No authentication token
- `404 Not Found` - User is not staff in this store
- `500 Internal Server Error` - Server error

---

## Usage Examples

### Get All User Stores
```bash
curl -X GET http://localhost:3007/api/v1/stores/user/stores \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get User Role in Store
```bash
curl -X GET http://localhost:3007/api/v1/stores/user/stores/STORE_UUID/role \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get User Permissions
```bash
curl -X GET http://localhost:3007/api/v1/stores/user/stores/STORE_UUID/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Complete Store Info
```bash
curl -X GET http://localhost:3007/api/v1/stores/user/stores/STORE_UUID/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "code": "NO_AUTH"
}
```

### 404 Not Found
```json
{
  "error": "User is not staff in this store",
  "code": "NOT_STORE_STAFF"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## Implementation Details

### Database Queries
- All queries filter by `storeStaff.isActive = true` to ensure only active staff memberships are returned
- Permissions are filtered by `permissions.isActive = true` to exclude deactivated permissions
- Queries use JOINs across `store_staff`, `stores`, `roles`, `permissions`, and `role_permissions` tables

### Security
- User ID is extracted from JWT token (`req.user.id`)
- Users can only access information for stores where they are staff
- All endpoints are protected by authentication middleware
- Rate limiting is applied via `generalLimiter`

### Performance
- Efficient JOIN queries minimize database round trips
- Permissions are grouped by resource for easy frontend consumption
- Permission slugs array provided for quick permission checks

## Related Endpoints

These endpoints complement the auth-service `/admin/login` endpoint, which returns similar information during authentication:
- **Auth Service Login:** Returns store staff info during login
- **Store Service APIs:** Allow querying store info on-demand without re-authentication

## Frontend Integration

Frontend applications can use these APIs to:
1. Display list of stores where user is staff (dashboard/store switcher)
2. Show user's role in current store context
3. Implement permission-based UI rendering
4. Cache permissions for client-side authorization checks
5. Build dynamic navigation based on user permissions

Example React usage:
```typescript
// Get user stores for store switcher
const { stores } = await fetch('/api/v1/stores/user/stores', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// Get permissions for current store
const { permissionSlugs } = await fetch(`/api/v1/stores/user/stores/${storeId}/permissions`, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// Check permissions
const canCreateProducts = permissionSlugs.includes('products.create');
```
