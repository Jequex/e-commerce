import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@ecommerce/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveCart();
    }
  }, [items, isLoading]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart_items');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('cart_items', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addItem = (product: Product, quantity: number = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.productId === product.id);
      
      if (existingItem) {
        return currentItems.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: `cart_${Date.now()}`,
          cartId: 'local_cart',
          productId: product.id,
          variantId: product.variants[0]?.id || '',
          product,
          variant: product.variants[0],
          quantity,
          price: product.variants[0]?.price || 0,
          total: (product.variants[0]?.price || 0) * quantity,
        };
        return [...currentItems, newItem];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              total: item.price * quantity,
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const value: CartContextType = {
    items,
    totalItems,
    totalAmount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isLoading,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}