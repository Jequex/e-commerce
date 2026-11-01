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
import { AuthenticatedRequest } from '../middleware/auth';

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

      // 1. Calculate subtotal & platform markup
      let subtotalPrice = 0;
      let platformMarkupAmount = 0;
      const defaultPlatformMarkupRate = 15.0; // 15% platform markup default

      for (const item of validatedData.lineItems) {
        const itemTotal = item.price * item.quantity;
        subtotalPrice += itemTotal;
        let itemMarkup = 0;
        if (item.platformMarkupAmount !== undefined) {
          itemMarkup = item.platformMarkupAmount * item.quantity;
        } else if (item.platformMarkupRate !== undefined) {
          const itemBase = item.price / (1 + item.platformMarkupRate / 100);
          itemMarkup = (item.price - itemBase) * item.quantity;
        } else {
          itemMarkup = (itemTotal * defaultPlatformMarkupRate) / 100;
        }
        platformMarkupAmount += itemMarkup;
      }

      // 2. Calculate discounts and attribute deductions to creator:
      // - If created by super admin: Jequex bears the cost from our platform markup.
      // - If created by admin: The store bears the cost from their store payout.
      let superAdminDiscountAmount = 0;
      let adminDiscountAmount = 0;
      const processedDiscounts: any[] = [];

      for (const discount of validatedData.discounts) {
        let amount = 0;
        if (discount.type === 'percentage') {
          amount = (subtotalPrice * discount.value) / 100;
        } else if (discount.type === 'fixed_amount') {
          amount = discount.value;
        }

        const isSuperAdmin = discount.createdByRole === 'super_admin' || discount.fundedBy === 'platform';
        const fundedBy = isSuperAdmin ? 'platform' : 'store';
        const createdByRole = isSuperAdmin ? 'super_admin' : 'admin';

        if (isSuperAdmin) {
          superAdminDiscountAmount += amount;
        } else {
          adminDiscountAmount += amount;
        }

        processedDiscounts.push({
          code: discount.code,
          type: discount.type,
          value: discount.value,
          amount,
          title: discount.title,
          description: discount.description,
          createdById: discount.createdById,
          createdByRole,
          createdByName: discount.createdByName,
          storeId: discount.storeId || validatedData.storeId,
          fundedBy,
        });
      }

      const totalDiscounts = superAdminDiscountAmount + adminDiscountAmount;
      const totalTax = 0;
      const totalShipping = 0;
      const totalPrice = Math.max(0, subtotalPrice + totalTax + totalShipping - totalDiscounts);

      // Financial balance formulas:
      // Jequex Net Profit = Markup - Super Admin Discounts
      // Store Net Payout = (Subtotal - Markup) - Admin Discounts
      const platformNetProfit = Math.max(0, platformMarkupAmount - superAdminDiscountAmount);
      const storeNetPayout = Math.max(0, (subtotalPrice - platformMarkupAmount) - adminDiscountAmount);

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      // Create the order in a transaction
      const result = await db.transaction(async (tx) => {
        // Create order
        const orderData: typeof orders.$inferInsert = {
          orderNumber,
          userId: validatedData.userId,
          email: validatedData.email,
          storeId: validatedData.storeId,
          platformMarkupRate: defaultPlatformMarkupRate.toFixed(2),
          platformMarkupAmount: platformMarkupAmount.toFixed(2),
          superAdminDiscountAmount: superAdminDiscountAmount.toFixed(2),
          adminDiscountAmount: adminDiscountAmount.toFixed(2),
          platformNetProfit: platformNetProfit.toFixed(2),
          storeNetPayout: storeNetPayout.toFixed(2),
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

        // Create line items with profit attribution
        const lineItemsData = validatedData.lineItems.map(item => {
          const itemTotal = item.price * item.quantity;
          const itemMarkup = (itemTotal * defaultPlatformMarkupRate) / 100;
          return {
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            storeId: item.storeId || validatedData.storeId,
            categoryId: item.categoryId,
            quantity: item.quantity,
            price: item.price.toFixed(2),
            totalPrice: itemTotal.toFixed(2),
            markupPercentage: defaultPlatformMarkupRate.toFixed(2),
            markupAmount: itemMarkup.toFixed(2),
            storePayout: (itemTotal - itemMarkup).toFixed(2),
            platformProfit: itemMarkup.toFixed(2),
            productTitle: 'Product Title',
            variantTitle: item.variantId ? 'Variant Title' : null,
            properties: item.properties,
          };
        });

        const newLineItems = await tx.insert(orderLineItems).values(lineItemsData).returning();

        // Create discounts with creator & funder attribution
        if (processedDiscounts.length > 0) {
          const discountsData = processedDiscounts.map(discount => ({
            orderId: newOrder.id,
            code: discount.code,
            type: discount.type,
            value: discount.value.toFixed(2),
            amount: discount.amount.toFixed(2),
            title: discount.title,
            description: discount.description,
            createdById: discount.createdById,
            createdByRole: discount.createdByRole,
            createdByName: discount.createdByName,
            storeId: discount.storeId,
            fundedBy: discount.fundedBy,
          }));

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
      console.log(req.user);
      
      if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
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
        search,
        userId,
        storeId
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      const conditions = [];

      // If user is a merchant admin (not super_admin), restrict strictly to orders for their stores
      if (req.user?.role === 'admin') {
        const storeServiceUrl = process.env.STORE_SERVICE_URL || 'http://store-service:3007';
        let userStoreIds: string[] = [];

        if (req.headers.authorization) {
          try {
            const userRes = await fetch(`${storeServiceUrl}/api/v1/stores/user/stores`, {
              headers: { Authorization: req.headers.authorization },
            });
            if (userRes.ok) {
              const data = await userRes.json();
              const storeList = data.stores || [];
              if (storeList.length > 0) {
                userStoreIds = storeList.map((s: any) => s.id || s.storeId);
              }
            }
          } catch (_) {}
        }

        if (userStoreIds.length === 0) {
          try {
            const sRes = await fetch(`${storeServiceUrl}/api/v1/stores?ownerId=${req.user.id}&limit=100`);
            if (sRes.ok) {
              const sData = await sRes.json();
              userStoreIds = (sData.stores || []).map((s: any) => s.id);
            }
          } catch (e) {
            console.error('Failed to get admin stores in order service:', e);
          }
        }

        if (userStoreIds.length === 0) {
          return res.json({
            orders: [],
            pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
          });
        }

        if (storeId && typeof storeId === 'string' && storeId !== 'all') {
          if (!userStoreIds.includes(storeId)) {
            return res.status(403).json({ error: 'You do not have access to this store', code: 'FORBIDDEN' });
          }
          conditions.push(eq(orders.storeId, storeId));
        } else {
          conditions.push(inArray(orders.storeId, userStoreIds));
        }
      } else if (storeId && typeof storeId === 'string' && storeId !== 'all') {
        conditions.push(eq(orders.storeId, storeId));
      }

      if (userId) {
        conditions.push(eq(orders.userId, userId as string));
      }

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

  // ==================== FINANCIAL REPORTS & PROFIT TRACKING ====================

  // Super Admin: Jequex Platform Financial & Profit Reports
  async getPlatformReports(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Super Admin access required',
          code: 'SUPER_ADMIN_REQUIRED'
        });
      }

      const { startDate, endDate, storeId } = req.query;
      const conditions = [];

      if (storeId && typeof storeId === 'string') {
        conditions.push(eq(orders.storeId, storeId));
      }
      if (startDate && typeof startDate === 'string') {
        conditions.push(sql`${orders.createdAt} >= ${new Date(startDate)}`);
      }
      if (endDate && typeof endDate === 'string') {
        conditions.push(sql`${orders.createdAt} <= ${new Date(endDate)}`);
      }

      const allOrders = await db.query.orders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          lineItems: true,
          discounts: true,
        },
        orderBy: desc(orders.createdAt),
      });

      let totalGrossSales = 0;
      let totalSubtotal = 0;
      let totalPlatformMarkup = 0;
      let totalSuperAdminDiscounts = 0;
      let totalAdminDiscounts = 0;
      let netPlatformProfit = 0;
      let totalStorePayouts = 0;

      const storeAgg: Record<string, {
        storeId: string;
        ordersCount: number;
        grossSales: number;
        platformMarkup: number;
        superAdminDiscounts: number;
        adminDiscounts: number;
        netPlatformProfit: number;
        netStorePayout: number;
      }> = {};

      for (const ord of allOrders) {
        const subtotal = Number(ord.subtotalPrice || 0);
        const gross = Number(ord.totalPrice || 0);
        const markup = Number(ord.platformMarkupAmount || (subtotal * 0.15));
        const superDiscount = Number(ord.superAdminDiscountAmount || 0);
        const adminDiscount = Number(ord.adminDiscountAmount || 0);
        const platProfit = Number(ord.platformNetProfit || Math.max(0, markup - superDiscount));
        const storePayout = Number(ord.storeNetPayout || Math.max(0, (subtotal - markup) - adminDiscount));

        totalSubtotal += subtotal;
        totalGrossSales += gross;
        totalPlatformMarkup += markup;
        totalSuperAdminDiscounts += superDiscount;
        totalAdminDiscounts += adminDiscount;
        netPlatformProfit += platProfit;
        totalStorePayouts += storePayout;

        const sId = ord.storeId || 'general-store';
        if (!storeAgg[sId]) {
          storeAgg[sId] = {
            storeId: sId,
            ordersCount: 0,
            grossSales: 0,
            platformMarkup: 0,
            superAdminDiscounts: 0,
            adminDiscounts: 0,
            netPlatformProfit: 0,
            netStorePayout: 0,
          };
        }
        storeAgg[sId].ordersCount += 1;
        storeAgg[sId].grossSales += gross;
        storeAgg[sId].platformMarkup += markup;
        storeAgg[sId].superAdminDiscounts += superDiscount;
        storeAgg[sId].adminDiscounts += adminDiscount;
        storeAgg[sId].netPlatformProfit += platProfit;
        storeAgg[sId].netStorePayout += storePayout;
      }

      res.json({
        summary: {
          totalOrders: allOrders.length,
          totalGrossSales: Math.round(totalGrossSales * 100) / 100,
          totalSubtotal: Math.round(totalSubtotal * 100) / 100,
          totalPlatformMarkup: Math.round(totalPlatformMarkup * 100) / 100,
          superAdminDiscountsFunded: Math.round(totalSuperAdminDiscounts * 100) / 100,
          adminDiscountsFunded: Math.round(totalAdminDiscounts * 100) / 100,
          netPlatformProfit: Math.round(netPlatformProfit * 100) / 100,
          totalStorePayouts: Math.round(totalStorePayouts * 100) / 100,
          platformMarginRate: totalSubtotal > 0 ? ((netPlatformProfit / totalSubtotal) * 100).toFixed(2) + '%' : '0.00%',
        },
        storeBreakdowns: Object.values(storeAgg),
        recentOrders: allOrders.slice(0, 50).map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          subtotalPrice: o.subtotalPrice,
          totalPrice: o.totalPrice,
          platformMarkupAmount: o.platformMarkupAmount,
          superAdminDiscountAmount: o.superAdminDiscountAmount,
          adminDiscountAmount: o.adminDiscountAmount,
          platformNetProfit: o.platformNetProfit,
          storeNetPayout: o.storeNetPayout,
          discounts: o.discounts,
        }))
      });
    } catch (error) {
      console.error('Get platform reports error:', error);
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }

  // Merchant / Admin: Store-Specific Profit & Payout Reports
  async getStoreReports(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Admin access required', code: 'ADMIN_REQUIRED' });
      }

      // If regular admin, strictly restrict to their storeId
      const targetStoreId = user.role === 'super_admin' ? (req.query.storeId as string) : user.storeId;
      const conditions = [];

      if (targetStoreId) {
        conditions.push(eq(orders.storeId, targetStoreId));
      }

      const storeOrders = await db.query.orders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          lineItems: true,
          discounts: true,
        },
        orderBy: desc(orders.createdAt),
      });

      let totalGrossSales = 0;
      let totalSubtotal = 0;
      let totalPlatformFees = 0;
      let totalStoreDiscounts = 0;
      let totalJequexSponsoredDiscounts = 0;
      let netStorePayout = 0;

      for (const ord of storeOrders) {
        const subtotal = Number(ord.subtotalPrice || 0);
        const gross = Number(ord.totalPrice || 0);
        const fee = Number(ord.platformMarkupAmount || (subtotal * 0.15));
        const storeDisc = Number(ord.adminDiscountAmount || 0);
        const jequexDisc = Number(ord.superAdminDiscountAmount || 0);
        const payout = Number(ord.storeNetPayout || Math.max(0, (subtotal - fee) - storeDisc));

        totalSubtotal += subtotal;
        totalGrossSales += gross;
        totalPlatformFees += fee;
        totalStoreDiscounts += storeDisc;
        totalJequexSponsoredDiscounts += jequexDisc;
        netStorePayout += payout;
      }

      res.json({
        summary: {
          storeId: targetStoreId || 'all_stores',
          totalOrders: storeOrders.length,
          totalGrossSales: Math.round(totalGrossSales * 100) / 100,
          totalSubtotal: Math.round(totalSubtotal * 100) / 100,
          totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
          totalStoreDiscounts: Math.round(totalStoreDiscounts * 100) / 100,
          totalJequexSponsoredDiscounts: Math.round(totalJequexSponsoredDiscounts * 100) / 100,
          netStorePayout: Math.round(netStorePayout * 100) / 100,
        },
        orders: storeOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          subtotalPrice: o.subtotalPrice,
          totalPrice: o.totalPrice,
          platformFee: o.platformMarkupAmount,
          storeDiscount: o.adminDiscountAmount,
          jequexSponsoredDiscount: o.superAdminDiscountAmount,
          netPayout: o.storeNetPayout,
          discounts: o.discounts,
        }))
      });
    } catch (error) {
      console.error('Get store reports error:', error);
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  }
}