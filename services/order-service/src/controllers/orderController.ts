import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  orders, 
  orderLineItems,
  orderTransactions,
  orderFulfillments,
  orderDiscounts,
  orderEvents,
  shoppingCarts,
  cartLineItems,
  type Order,
  type NewOrder,
  createOrderSchema,
  updateOrderSchema,
  addToCartSchema,
  updateCartItemSchema,
  OrderStatus,
  FinancialStatus,
  FulfillmentStatus
} from '../schema/orders';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class OrderController {
  // Generate unique order number
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  // Create new order
  async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = createOrderSchema.parse(req.body);

      // Calculate totals
      let subtotalPrice = 0;
      let totalDiscounts = 0;

      // Calculate subtotal from line items
      for (const item of validatedData.lineItems) {
        subtotalPrice += item.price * item.quantity;
      }

      // Calculate discount amount
      for (const discount of validatedData.discounts) {
        if (discount.type === 'percentage') {
          totalDiscounts += (subtotalPrice * discount.value) / 100;
        } else if (discount.type === 'fixed_amount') {
          totalDiscounts += discount.value;
        }
      }

      // For now, assume no tax or shipping - these would be calculated by external services
      const totalTax = 0;
      const totalShipping = 0;
      const totalPrice = subtotalPrice + totalTax + totalShipping - totalDiscounts;

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      // Create the order in a transaction
      const result = await db.transaction(async (tx) => {
        // Create order
        const orderData: typeof orders.$inferInsert = {
          orderNumber,
          userId: validatedData.userId,
          email: validatedData.email,
          subtotalPrice: subtotalPrice.toFixed(2),
          totalTax: totalTax.toFixed(2),
          totalShipping: totalShipping.toFixed(2),
          totalDiscounts: totalDiscounts.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          customerInfo: validatedData.customerInfo,
          billingAddress: validatedData.billingAddress as any,
          shippingAddress: validatedData.shippingAddress as any,
          notes: validatedData.notes,
          tags: validatedData.tags,
        };
        
        const [newOrder] = await tx.insert(orders).values(orderData).returning();

        // Create line items
        const lineItemsData = validatedData.lineItems.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price.toFixed(2),
          totalPrice: (item.price * item.quantity).toFixed(2),
          productTitle: 'Product Title', // Would be fetched from product service
          variantTitle: item.variantId ? 'Variant Title' : null,
          properties: item.properties,
        }));

        const newLineItems = await tx.insert(orderLineItems).values(lineItemsData).returning();

        // Create discounts
        if (validatedData.discounts.length > 0) {
          const discountsData = validatedData.discounts.map(discount => {
            let amount = 0;
            if (discount.type === 'percentage') {
              amount = (subtotalPrice * discount.value) / 100;
            } else if (discount.type === 'fixed_amount') {
              amount = discount.value;
            }

            return {
              orderId: newOrder.id,
              code: discount.code,
              type: discount.type,
              value: discount.value.toFixed(2),
              amount: amount.toFixed(2),
              title: discount.title,
              description: discount.description,
            };
          });

          await tx.insert(orderDiscounts).values(discountsData);
        }

        // Create order created event
        await tx.insert(orderEvents).values({
          orderId: newOrder.id,
          eventType: 'created',
          description: 'Order created',
          actorId: req.user?.id,
          actorType: 'user',
          newValues: { status: 'pending' },
        });

        return { order: newOrder, lineItems: newLineItems };
      });

      res.status(201).json({
        message: 'Order created successfully',
        order: result.order,
        lineItems: result.lineItems,
      });

    } catch (error) {
      console.error('Create order error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get orders for a user
  async getUserOrders(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { 
        page = 1, 
        limit = 20, 
        status,
        startDate,
        endDate
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      const conditions = [eq(orders.userId, req.user.id)];

      if (status) {
        conditions.push(eq(orders.status, status as string));
      }

      if (startDate) {
        conditions.push(sql`${orders.createdAt} >= ${new Date(startDate as string)}`);
      }

      if (endDate) {
        conditions.push(sql`${orders.createdAt} <= ${new Date(endDate as string)}`);
      }

      const userOrders = await db.query.orders.findMany({
        where: and(...conditions),
        with: {
          lineItems: true,
          transactions: true,
          fulfillments: true,
          discounts: true,
        },
        orderBy: desc(orders.createdAt),
        limit: limitNum,
        offset: offset,
      });

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(...conditions));

      const totalPages = Math.ceil(count / limitNum);

      res.json({
        orders: userOrders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      });

    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get single order by ID
  async getOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          lineItems: true,
          transactions: {
            orderBy: desc(orderTransactions.createdAt)
          },
          fulfillments: {
            with: {
              lineItems: true
            },
            orderBy: desc(orderFulfillments.createdAt)
          },
          discounts: true,
          events: {
            orderBy: desc(orderEvents.createdAt)
          }
        }
      });

      if (!order) {
        return res.status(404).json({
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Check if user owns this order or is admin
      if (req.user?.role !== 'admin' && order.userId !== req.user?.id) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      res.json({
        order
      });

    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Update order (admin only)
  async updateOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateOrderSchema.parse(req.body);

      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      // Get current order
      const currentOrder = await db.query.orders.findFirst({
        where: eq(orders.id, id)
      });

      if (!currentOrder) {
        return res.status(404).json({
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Update order in transaction
      const result = await db.transaction(async (tx) => {
        const [updatedOrder] = await tx
          .update(orders)
          .set({
            ...validatedData,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, id))
          .returning();

        // Create event for the update
        await tx.insert(orderEvents).values({
          orderId: id,
          eventType: 'updated',
          description: 'Order updated by admin',
          actorId: req.user?.id,
          actorType: 'admin',
          previousValues: currentOrder,
          newValues: validatedData,
        });

        return updatedOrder;
      });

      res.json({
        message: 'Order updated successfully',
        order: result
      });

    } catch (error) {
      console.error('Update order error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Cancel order
  async cancelOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Get current order
      const currentOrder = await db.query.orders.findFirst({
        where: eq(orders.id, id)
      });

      if (!currentOrder) {
        return res.status(404).json({
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Check if user owns this order or is admin
      if (req.user?.role !== 'admin' && currentOrder.userId !== req.user?.id) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Check if order can be cancelled
      if (!['pending', 'confirmed'].includes(currentOrder.status)) {
        return res.status(400).json({
          error: 'Order cannot be cancelled in current status',
          code: 'CANNOT_CANCEL'
        });
      }

      // Cancel order
      const result = await db.transaction(async (tx) => {
        const [updatedOrder] = await tx
          .update(orders)
          .set({
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, id))
          .returning();

        // Create cancellation event
        await tx.insert(orderEvents).values({
          orderId: id,
          eventType: 'cancelled',
          description: reason || 'Order cancelled',
          actorId: req.user?.id,
          actorType: req.user?.role === 'admin' ? 'admin' : 'user',
          previousValues: { status: currentOrder.status },
          newValues: { status: OrderStatus.CANCELLED },
          metadata: { reason },
        });

        return updatedOrder;
      });

      res.json({
        message: 'Order cancelled successfully',
        order: result
      });

    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get all orders (admin only)
  async getAllOrders(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      const { 
        page = 1, 
        limit = 50, 
        status,
        financialStatus,
        fulfillmentStatus,
        search
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      const conditions = [];

      if (status) {
        conditions.push(eq(orders.status, status as string));
      }

      if (financialStatus) {
        conditions.push(eq(orders.financialStatus, financialStatus as string));
      }

      if (fulfillmentStatus) {
        conditions.push(eq(orders.fulfillmentStatus, fulfillmentStatus as string));
      }

      if (search) {
        conditions.push(sql`${orders.orderNumber} ILIKE ${'%' + search + '%'} OR ${orders.email} ILIKE ${'%' + search + '%'}`);
      }

      const allOrders = await db.query.orders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          lineItems: true,
          transactions: true,
          fulfillments: true,
        },
        orderBy: desc(orders.createdAt),
        limit: limitNum,
        offset: offset,
      });

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const totalPages = Math.ceil(count / limitNum);

      res.json({
        orders: allOrders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      });

    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Shopping cart operations
  async addToCart(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = addToCartSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Find or create cart for user
      let cart = await db.query.shoppingCarts.findFirst({
        where: eq(shoppingCarts.userId, req.user.id)
      });

      if (!cart) {
        [cart] = await db.insert(shoppingCarts).values({
          userId: req.user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }).returning();
      }

      // Check if item already exists in cart
      const existingItem = await db.query.cartLineItems.findFirst({
        where: and(
          eq(cartLineItems.cartId, cart.id),
          eq(cartLineItems.productId, validatedData.productId),
          validatedData.variantId ? eq(cartLineItems.variantId, validatedData.variantId) : sql`${cartLineItems.variantId} IS NULL`
        )
      });

      if (existingItem) {
        // Update quantity
        const [updatedItem] = await db
          .update(cartLineItems)
          .set({
            quantity: existingItem.quantity + validatedData.quantity,
            properties: validatedData.properties || existingItem.properties,
            updatedAt: new Date(),
          })
          .where(eq(cartLineItems.id, existingItem.id))
          .returning();

        res.json({
          message: 'Item quantity updated in cart',
          cartItem: updatedItem
        });
      } else {
        // Add new item
        const [newItem] = await db.insert(cartLineItems).values({
          cartId: cart.id,
          productId: validatedData.productId,
          variantId: validatedData.variantId,
          quantity: validatedData.quantity,
          properties: validatedData.properties,
        }).returning();

        res.json({
          message: 'Item added to cart',
          cartItem: newItem
        });
      }

    } catch (error) {
      console.error('Add to cart error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Get user's cart
  async getCart(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const cart = await db.query.shoppingCarts.findFirst({
        where: eq(shoppingCarts.userId, req.user.id),
        with: {
          lineItems: true
        }
      });

      if (!cart) {
        return res.json({
          cart: null,
          itemCount: 0
        });
      }

      // TODO: Fetch product details from product service for each line item
      
      res.json({
        cart,
        itemCount: cart.lineItems.reduce((sum, item) => sum + item.quantity, 0)
      });

    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Update cart item
  async updateCartItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.params;
      const validatedData = updateCartItemSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Get cart item and verify ownership
      const cartItem = await db.query.cartLineItems.findFirst({
        where: eq(cartLineItems.id, itemId),
        with: {
          cart: true
        }
      });

      if (!cartItem) {
        return res.status(404).json({
          error: 'Cart item not found',
          code: 'CART_ITEM_NOT_FOUND'
        });
      }

      // Verify ownership
      const cart = Array.isArray(cartItem.cart) ? cartItem.cart[0] : cartItem.cart;
      if (!cart || cart.userId !== req.user.id) {
        return res.status(404).json({
          error: 'Cart item not found',
          code: 'CART_ITEM_NOT_FOUND'
        });
      }

      if (validatedData.quantity === 0) {
        // Remove item
        await db.delete(cartLineItems).where(eq(cartLineItems.id, itemId));
        
        res.json({
          message: 'Item removed from cart'
        });
      } else {
        // Update item
        const [updatedItem] = await db
          .update(cartLineItems)
          .set({
            quantity: validatedData.quantity,
            properties: validatedData.properties || cartItem.properties,
            updatedAt: new Date(),
          })
          .where(eq(cartLineItems.id, itemId))
          .returning();

        res.json({
          message: 'Cart item updated',
          cartItem: updatedItem
        });
      }

    } catch (error) {
      console.error('Update cart item error:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Clear cart
  async clearCart(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Find user's cart
      const cart = await db.query.shoppingCarts.findFirst({
        where: eq(shoppingCarts.userId, req.user.id)
      });

      if (cart) {
        // Delete all cart items
        await db.delete(cartLineItems).where(eq(cartLineItems.cartId, cart.id));
      }

      res.json({
        message: 'Cart cleared successfully'
      });

    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async removeCartItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.params;

      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Get cart item and verify ownership
      const cartItem = await db.query.cartLineItems.findFirst({
        where: eq(cartLineItems.id, itemId),
        with: {
          cart: true
        }
      });

      if (!cartItem) {
        return res.status(404).json({
          error: 'Cart item not found',
          code: 'CART_ITEM_NOT_FOUND'
        });
      }

      // Verify ownership
      const cart = Array.isArray(cartItem.cart) ? cartItem.cart[0] : cartItem.cart;
      if (!cart || cart.userId !== req.user.id) {
        return res.status(404).json({
          error: 'Cart item not found',
          code: 'CART_ITEM_NOT_FOUND'
        });
      }

      // Remove item
      await db.delete(cartLineItems).where(eq(cartLineItems.id, itemId));
      
      res.json({
        message: 'Item removed from cart'
      });

    } catch (error) {
      console.error('Remove cart item error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}