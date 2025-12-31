import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '@/api-calls/cart';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku: string;
  maxQuantity?: number;
  variantId?: string;
}

interface CartStore {
  items: CartItem[];
  isSyncing: boolean;
  isAuthenticated: boolean;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  syncWithServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  setAuthenticated: (isAuth: boolean) => void;
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,
      isAuthenticated: false,
      
      setAuthenticated: (isAuth) => {
        set({ isAuthenticated: isAuth });
        if (isAuth) {
          // Sync local cart with server when user logs in
          get().syncWithServer();
        }
      },

      setItems: (items) => {
        set({ items });
      },
      
      addItem: (item) => {
        const quantity = item.quantity || 1;
        const existingItem = get().items.find((i) => i.productId === item.productId);
        
        if (existingItem) {
          // Update quantity if item already exists
          const newQuantity = existingItem.quantity + quantity;
          const maxQty = item.maxQuantity || 999;
          
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: Math.min(newQuantity, maxQty) }
                : i
            ),
          });
        } else {
          // Add new item
          set({
            items: [...get().items, { ...item, quantity }],
          });
        }

        // Sync with server if authenticated
        if (get().isAuthenticated && !get().isSyncing) {
          cartApi.addItem({
            productId: item.productId,
            variantId: item.variantId,
            quantity,
          }).catch(err => console.error('Error syncing cart to server:', err));
        }
      },
      
      removeItem: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        
        set({
          items: get().items.filter((i) => i.productId !== productId),
        });

        // Sync with server if authenticated
        if (get().isAuthenticated && item && !get().isSyncing) {
          cartApi.removeItem(item.id).catch(err => console.error('Error removing item from server:', err));
        }
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        const item = get().items.find((i) => i.productId === productId);
        
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(quantity, i.maxQuantity || 999) }
              : i
          ),
        });

        // Sync with server if authenticated
        if (get().isAuthenticated && item && !get().isSyncing) {
          cartApi.updateItem(item.id, { quantity }).catch(err => console.error('Error updating item on server:', err));
        }
      },
      
      clearCart: () => {
        set({ items: [] });

        // Clear server cart if authenticated
        if (get().isAuthenticated && !get().isSyncing) {
          cartApi.clearCart().catch(err => console.error('Error clearing server cart:', err));
        }
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      // Sync local cart to server (called on login)
      syncWithServer: async () => {
        const localItems = get().items;
        if (localItems.length === 0) {
          // No local items, just load from server
          await get().loadFromServer();
          return;
        }

        try {
          set({ isSyncing: true });

          // Get server cart
          const serverCart = await cartApi.getCart();
          
          if (!serverCart || serverCart.lineItems.length === 0) {
            // Server cart is empty, sync all local items to server
            await cartApi.syncLocalCart(
              localItems.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
              }))
            );
          } else {
            // Merge: add local items that aren't on server
            const serverProductIds = new Set(
              serverCart.lineItems.map(item => item.productId)
            );

            for (const localItem of localItems) {
              if (!serverProductIds.has(localItem.productId)) {
                await cartApi.addItem({
                  productId: localItem.productId,
                  variantId: localItem.variantId,
                  quantity: localItem.quantity,
                });
              }
            }
          }

          // Load final merged cart from server
          await get().loadFromServer();
        } catch (error) {
          console.error('Error syncing cart with server:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Load cart from server (called when authenticated)
      loadFromServer: async () => {
        try {
          set({ isSyncing: true });
          const serverCart = await cartApi.getCart();
          
          if (serverCart && serverCart.lineItems.length > 0) {
            // TODO: Fetch product details for each item to get name, price, image, etc.
            // For now, we'll keep the local items structure but this should be enhanced
            // to fetch product details from the product service
            
            // Map server items to local cart format
            // This is a simplified version - in production you'd fetch full product details
            const items = serverCart.lineItems.map(item => ({
              id: item.id,
              productId: item.productId,
              variantId: item.variantId || undefined,
              name: 'Product', // Should fetch from product service
              price: 0, // Should fetch from product service
              quantity: item.quantity,
              sku: '', // Should fetch from product service
            }));
            
            set({ items });
          }
        } catch (error) {
          console.error('Error loading cart from server:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
