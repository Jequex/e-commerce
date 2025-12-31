# Cart Synchronization with Database

This document explains how the local cart (stored in localStorage) is synchronized with the database when users log in or log out.

## Overview

The cart synchronization system ensures that:
1. **Guest users** can add items to their cart, which is stored locally in localStorage
2. **Authenticated users** have their cart synchronized with the database
3. When a user **logs in**, their local cart is merged with their server-side cart
4. Cart operations automatically sync with the server when authenticated

## Architecture

### Components

1. **Cart Store** (`apps/web/src/stores/use-cart-store.ts`)
   - Zustand store with localStorage persistence
   - Manages cart state and operations
   - Handles synchronization with server

2. **Cart API** (`apps/web/src/api-calls/cart.ts`)
   - API client for cart operations
   - Communicates with order-service endpoints
   - Handles cart CRUD operations

3. **Auth Provider** (`apps/web/src/providers/AuthProvider.tsx`)
   - Manages authentication state
   - Triggers cart sync on login
   - Stores user info and token

4. **Order Service** (`services/order-service/`)
   - Backend service managing cart database operations
   - Endpoints: `/api/cart/*`
   - Port: 3003

## How It Works

### 1. Guest User Flow

```
User adds item → Cart Store → localStorage
```

- Items are stored locally using Zustand persist middleware
- No authentication required
- Cart persists across browser sessions

### 2. Login Flow

```
User logs in → Auth Provider → setAuthenticated(true) → Cart Store → syncWithServer()
```

**Sync Process:**

1. User authenticates via AuthModal
2. AuthProvider calls `login(token, userData)`
3. Token and user data stored in localStorage
4. `setCartAuthenticated(true)` triggers sync
5. Cart store's `syncWithServer()` method:
   - Fetches server cart via `cartApi.getCart()`
   - If server cart is empty: uploads all local items
   - If server cart exists: merges local items not on server
   - Loads final merged cart from server

### 3. Authenticated User Operations

```
User adds item → Cart Store → Update localStorage + Sync to Server
```

When authenticated, all cart operations automatically sync:

- **Add Item**: Adds to local store AND calls `cartApi.addItem()`
- **Remove Item**: Removes from local store AND calls `cartApi.removeItem()`
- **Update Quantity**: Updates local store AND calls `cartApi.updateItem()`
- **Clear Cart**: Clears local store AND calls `cartApi.clearCart()`

### 4. Logout Flow

```
User logs out → Auth Provider → setAuthenticated(false) → Cart remains local
```

- User data and token removed from localStorage
- Cart remains in localStorage (can be changed if needed)
- Cart stops syncing with server

## API Endpoints

### Cart Endpoints (Order Service - Port 3003)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/cart/update/:itemId` | Update cart item quantity |
| DELETE | `/api/cart/remove/:itemId` | Remove item from cart |
| DELETE | `/api/cart/clear` | Clear entire cart |

### Authentication Required

All cart endpoints require:
- `Authorization: Bearer <token>` header
- Valid JWT token from auth-service

## Database Schema

### Tables

**shopping_carts**
```sql
- id (UUID, PK)
- user_id (UUID, FK to users)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**cart_line_items**
```sql
- id (UUID, PK)
- cart_id (UUID, FK to shopping_carts)
- product_id (UUID)
- variant_id (UUID, nullable)
- quantity (INTEGER)
- properties (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Configuration

### Environment Variables

No additional environment variables required. The system uses existing:
- `JWT_SECRET` - For token validation
- Database connection settings in order-service

### URLs Configuration

Cart URLs defined in `apps/web/src/api-calls/urls.json`:
```json
{
  "cart": {
    "getCart": "localhost:3003/api/cart",
    "addItem": "localhost:3003/api/cart/add",
    "updateItem": "localhost:3003/api/cart/update/:itemId",
    "removeItem": "localhost:3003/api/cart/remove/:itemId",
    "clearCart": "localhost:3003/api/cart/clear"
  }
}
```

## Usage Examples

### Adding an Item to Cart

```typescript
import { useCartStore } from '@/stores/use-cart-store';

const addToCart = useCartStore((state) => state.addItem);

// Add item (works for both guest and authenticated users)
addToCart({
  id: product.id,
  productId: product.id,
  name: product.name,
  price: parseFloat(product.price),
  sku: product.sku,
  image: product.images?.[0],
  maxQuantity: product.inventoryQuantity,
  quantity: 1,
});
```

### Checking Authentication Status

```typescript
import { useCartStore } from '@/stores/use-cart-store';

const isAuthenticated = useCartStore((state) => state.isAuthenticated);
const isSyncing = useCartStore((state) => state.isSyncing);

// Display sync status
{isSyncing && <p>Syncing cart...</p>}
```

### Manual Sync (if needed)

```typescript
import { useCartStore } from '@/stores/use-cart-store';

const syncWithServer = useCartStore((state) => state.syncWithServer);

// Manually trigger sync
await syncWithServer();
```

## Error Handling

Cart sync operations include error handling:
- Errors are logged to console
- Failed syncs don't break the user experience
- Local cart remains functional even if server sync fails
- Toast notifications inform users of cart operations

## Future Enhancements

Potential improvements:

1. **Product Details Fetching**
   - Current: Server cart items need product details fetched
   - Enhancement: Integrate with product-service to fetch names, prices, images

2. **Conflict Resolution**
   - Current: Simple merge (local items added to server)
   - Enhancement: Smart merge with quantity addition, timestamp comparison

3. **Cart Expiration**
   - Current: 30-day expiration set on server
   - Enhancement: Periodic cleanup of expired carts

4. **Guest Cart Migration**
   - Current: Cart synced on login
   - Enhancement: Option to transfer guest cart to new account on registration

5. **Real-time Updates**
   - Current: Sync on operations
   - Enhancement: WebSocket for real-time cart updates across devices

## Testing

To test cart synchronization:

1. **Guest Flow**:
   - Add items to cart without logging in
   - Refresh page - cart should persist
   - Check localStorage for 'cart-storage'

2. **Login Sync**:
   - Add items as guest
   - Log in with existing account
   - Verify cart syncs with server
   - Check database for cart records

3. **Authenticated Operations**:
   - Log in
   - Add/remove/update items
   - Check network tab for API calls
   - Verify database updates

4. **Logout**:
   - Log out
   - Verify cart remains in localStorage
   - Add items - should not sync to server

## Troubleshooting

### Cart not syncing

1. Check authentication status:
   ```typescript
   const isAuth = useCartStore(state => state.isAuthenticated);
   console.log('Is authenticated:', isAuth);
   ```

2. Check network requests:
   - Open browser DevTools → Network tab
   - Look for calls to `localhost:3003/api/cart/*`
   - Check for authentication headers

3. Check server logs:
   ```bash
   docker logs ecommerce-order-service
   ```

### Items not appearing after login

1. Check if `syncWithServer()` was called
2. Verify token is valid and stored in localStorage
3. Check cart API responses in network tab
4. Ensure order-service is running

### Database connection issues

1. Verify order-service is running:
   ```bash
   docker ps | grep order-service
   ```

2. Check database connection in order-service logs

3. Verify database schema is up to date
