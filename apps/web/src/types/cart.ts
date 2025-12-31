export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  properties?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  id: string;
  userId: string;
  lineItems: CartItem[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartPayload {
  productId: string;
  variantId?: string;
  quantity: number;
  properties?: Record<string, any>;
}

export interface UpdateCartItemPayload {
  quantity: number;
  properties?: Record<string, any>;
}