import callApi from './callApi';
import urls from './urls.json';
import { Cart, CartItem, AddToCartPayload, UpdateCartItemPayload } from '@/types/cart';

export const cartApi = {
  // Get user's cart from server
  getCart: async (): Promise<Cart | null> => {
    try {
      const response = await callApi(`http://${urls.cart.getCart}`, {
        method: 'GET',
      });
      return response.cart;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  },

  // Add item to server cart
  addItem: async (payload: AddToCartPayload): Promise<CartItem> => {
    const response = await callApi(`http://${urls.cart.addItem}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.cartItem;
  },

  // Update cart item quantity
  updateItem: async (itemId: string, payload: UpdateCartItemPayload): Promise<CartItem> => {
    const url = `http://${urls.cart.updateItem.replace(':itemId', itemId)}`;
    const response = await callApi(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.cartItem;
  },

  // Remove item from cart
  removeItem: async (itemId: string): Promise<void> => {
    const url = `http://${urls.cart.removeItem.replace(':itemId', itemId)}`;
    await callApi(url, {
      method: 'DELETE',
    });
  },

  // Clear entire cart
  clearCart: async (): Promise<void> => {
    await callApi(`http://${urls.cart.clearCart}`, {
      method: 'DELETE',
    });
  },

  // Sync local cart items to server (merge)
  syncLocalCart: async (localItems: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    properties?: Record<string, any>;
  }>): Promise<Cart | null> => {
    try {
      // Add each local item to server cart
      for (const item of localItems) {
        await cartApi.addItem(item);
      }
      // Return updated cart
      return await cartApi.getCart();
    } catch (error) {
      console.error('Error syncing local cart:', error);
      return null;
    }
  },
};
