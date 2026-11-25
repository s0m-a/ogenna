import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CartStatus,
  MovementReason,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { STORE_CURRENCY } from '../common/constants/currency';
import { PrismaService } from '../database/prisma.service';
import { PaystackService } from '../payments/paystack.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';

/** Payment states in which money has not yet been received for the order. */
const UNSETTLED: PaymentStatus[] = [PaymentStatus.UNPAID, PaymentStatus.AWAITING_TRANSFER];

/**
 * Order states a successful charge can still settle. EXPIRED is included on
 * purpose: a bank transfer can land after the order has expired, and since no
 * stock is held for unpaid orders the payment is honoured if stock remains.
 */
const PAYABLE: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.EXPIRED];

/** Admin-driven status transitions. PAID and EXPIRED are only ever set by the system. */
const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CANCELLED],
  PAID: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
  EXPIRED: [],
};

/** Paystack transaction statuses that mean "still in flight". */
const GATEWAY_IN_FLIGHT = ['ongoing', 'pending', 'processing', 'queued'];

export type ChargeOutcome =
  | 'paid'
  | 'duplicate'
  | 'mismatch'
  | 'out_of_stock'
  | 'not_payable'
  | 'unknown_reference'
  | 'ignored';

export type PaymentDisplayState =
  | 'paid'
  | 'confirming'
  | 'awaiting_transfer'
  | 'not_completed'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'review';

export interface PaystackChargeData {
  id?: number | string;
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  channel?: string;
  paid_at?: string | null;
}

class OutOfStockError extends Error {}

/**
 * Settlement may queue behind other orders locking the same stock rows, so it
 * gets more headroom than Prisma's 5s interactive-transaction default.
 */
const SETTLE_TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

const CART_FOR_CHECKOUT = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      variant: {
        include: {
          inventory: true,
          images: { orderBy: { position: 'asc' as const }, take: 1 },
          product: {
            select: {
              name: true,
              status: true,
              sellingUnit: true,
              images: { orderBy: { position: 'asc' as const }, take: 1 },
            },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly config: ConfigService,
  ) {}

  // ── Checkout ───────────────────────────────────────────────────────────────

  /**
   * Converts the caller's active cart into a PENDING order and initializes a
   * Paystack transaction for it. Prices are re-read from the catalogue and
   * frozen onto the order; nothing monetary is accepted from the client.
   */
  async createFromCart(
    dto: CreateOrderDto,
    owner: { userId?: string | null; guestToken?: string | null },
  ) {
    const cart = owner.userId
      ? await this.prisma.cart.findUnique({
          where: { userId: owner.userId },
          include: CART_FOR_CHECKOUT,
        })
      : owner.guestToken
        ? await this.prisma.cart.findUnique({
            where: { guestToken: owner.guestToken },
            include: CART_FOR_CHECKOUT,
          })
        : null;

    if (!cart || cart.status !== CartStatus.ACTIVE || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty.');
    }

    const lines = cart.items.map((item) => {
      const { variant } = item;

      if (!variant.isActive || variant.product.status !== 'PUBLISHED') {
        throw new ConflictException(
          `'${variant.product.name}' is no longer available. Remove it from your cart to continue.`,
        );
      }

      if (variant.currencyCode !== STORE_CURRENCY) {
        throw new ConflictException(
          `'${variant.product.name}' is not priced in ${STORE_CURRENCY} and cannot be checked out.`,
        );
      }

      const available =
        (variant.inventory?.quantityOnHand ?? 0) - (variant.inventory?.quantityReserved ?? 0);

      if (available < item.quantity) {
        throw new ConflictException(
          `Only ${Math.max(available, 0)} of '${variant.product.name}' left in stock.`,
        );
      }

      const unitPriceAmount = variant.salePriceAmount ?? variant.priceAmount;

      return {
        variantId: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        sku: variant.sku,
        sellingUnit: variant.product.sellingUnit,
        imageUrl: variant.images[0]?.url ?? variant.product.images[0]?.url ?? null,
        quantity: item.quantity,
        unitPriceAmount,
        lineTotalAmount: unitPriceAmount * item.quantity,
        currencyCode: STORE_CURRENCY,
      };
    });

    const subtotalAmount = lines.reduce((sum, l) => sum + l.lineTotalAmount, 0);
    const shippingAmount = 0;
    const totalAmount = subtotalAmount + shippingAmount;

    if (totalAmount <= 0) {
      throw new BadRequestException('Order total must be greater than zero.');
    }

    const reference = this.generateReference();
    const expiryMinutes = parseInt(this.config.get('ORDER_PAYMENT_EXPIRY_MINUTES') ?? '1440', 10) || 1440;

    const order = await this.prisma.$transaction(async (tx) => {
      // Claim the cart. A concurrent duplicate submission finds no ACTIVE row
      // and is rejected, so a cart can only ever become one order. The owner
      // keys are cleared so the customer's next visit starts a fresh cart.
      const claimed = await tx.cart.updateMany({
        where: { id: cart.id, status: CartStatus.ACTIVE },
        data: { status: CartStatus.CONVERTED, guestToken: null, userId: null },
      });

      if (claimed.count !== 1) {
        throw new ConflictException('This cart has already been checked out.');
      }

      return tx.order.create({
        data: {
          reference,
          cartId: cart.id,
          userId: owner.userId ?? null,
          email: dto.email,
          customerName: dto.customerName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2 || null,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode || null,
          country: dto.country ?? 'NG',
          currencyCode: STORE_CURRENCY,
          subtotalAmount,
          shippingAmount,
          totalAmount,
          expiresAt: new Date(Date.now() + expiryMinutes * 60_000),
          items: { create: lines },
        },
      });
    });

    let initialized;
    try {
      initialized = await this.paystack.initializeTransaction({
        email: order.email,
        amount: order.totalAmount,
        currency: order.currencyCode,
        reference: order.reference,
        callbackUrl: this.config.getOrThrow<string>('PAYSTACK_CALLBACK_URL'),
        metadata: { orderId: order.id },
      });
    } catch (err) {
      // Payment could not be started: void the order and hand the cart back.
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            paymentNote: 'Payment could not be initialized.',
            cartId: null,
          },
        }),
        this.prisma.cart.update({
          where: { id: cart.id },
          data: {
            status: CartStatus.ACTIVE,
            guestToken: cart.guestToken,
            userId: cart.userId,
          },
        }),
      ]);
      throw err;
    }

    let saved: Prisma.OrderGetPayload<{ include: { items: true } }>;
    try {
      saved = await this.prisma.order.update({
        where: { id: order.id },
        data: {
          authorizationUrl: initialized.authorizationUrl,
          paystackAccessCode: initialized.accessCode,
        },
        include: { items: true },
      });
    } catch (err) {
      // The order is PENDING and the Paystack transaction is live. Log the codes
      // so support can share the authorization URL with the customer manually.
      this.logger.error(
        `Order ${order.reference}: Paystack init succeeded ` +
          `(accessCode=${initialized.accessCode}, url=${initialized.authorizationUrl}) ` +
          `but persisting the codes failed: ${(err as Error).message}. ` +
          `The order remains PENDING — customer can pay at the authorization URL.`,
      );
      throw err;
    }

    return {
      order: this.shapePublic(saved),
      authorizationUrl: initialized.authorizationUrl,
      // Lets the storefront open Paystack's popup for this transaction.
      accessCode: initialized.accessCode,
    };
  }

  /** Public lookup. The unguessable reference acts as the access capability. */
  async getByReference(reference: string) {
    const order = await this.prisma.order.findUnique({
      where: { reference },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found.');

    return this.shapePublic(order);
  }

  /**
   * Asks Paystack for the transaction state so the callback/confirmation page
   * can describe it. This is for DISPLAY only: it never marks an order PAID —
   * that happens solely in the signature-verified webhook. Its one side effect
   * is flagging an order as waiting for a bank transfer.
   */
  async verifyForDisplay(reference: string) {
    let order = await this.prisma.order.findUnique({
      where: { reference },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found.');

    let gatewayStatus: string | null = null;
    let channel: string | null = order.paymentChannel;
    let state: PaymentDisplayState;

    if (order.paymentStatus === PaymentStatus.PAID) {
      state = 'paid';
    } else if (
      order.paymentStatus === PaymentStatus.MISMATCH ||
      order.paymentStatus === PaymentStatus.REFUND_REQUIRED
    ) {
      state = 'review';
    } else if (order.status === OrderStatus.CANCELLED) {
      state = 'cancelled';
    } else {
      const expired = order.status === OrderStatus.EXPIRED;
      state = expired
        ? 'expired'
        : order.paymentStatus === PaymentStatus.AWAITING_TRANSFER
          ? 'awaiting_transfer'
          : 'not_completed';

      try {
        const tx = await this.paystack.verifyTransaction(reference);
        gatewayStatus = tx.status;
        channel = tx.channel ?? channel;

        if (tx.status === 'success') {
          // Paystack has the money; the webhook will settle the order.
          state = 'confirming';
        } else if (tx.status === 'failed' || tx.status === 'reversed') {
          state = expired ? 'expired' : 'failed';
        } else if (
          !expired &&
          (tx.channel === 'bank_transfer' || GATEWAY_IN_FLIGHT.includes(tx.status))
        ) {
          state = 'awaiting_transfer';
          await this.prisma.order.updateMany({
            where: {
              id: order.id,
              status: OrderStatus.PENDING,
              paymentStatus: PaymentStatus.UNPAID,
            },
            data: { paymentStatus: PaymentStatus.AWAITING_TRANSFER, paymentChannel: tx.channel },
          });
          order = await this.prisma.order.findUniqueOrThrow({
            where: { id: order.id },
            include: { items: true },
          });
        }
      } catch (err) {
        this.logger.warn(
          `verifyForDisplay: Paystack verify failed for ${reference}: ${(err as Error).message}`,
        );
      }
    }

    return {
      order: this.shapePublic(order),
      payment: { state, gatewayStatus, channel },
    };
  }

  // ── Paystack webhook ───────────────────────────────────────────────────────

  async handlePaystackWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    if (!this.paystack.verifySignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    let event: { event?: string; data?: PaystackChargeData };
    try {
      event = JSON.parse(rawBody!.toString('utf8'));
    } catch {
      throw new BadRequestException('Malformed webhook payload.');
    }

    if (event.event !== 'charge.success' || !event.data) {
      return { received: true, outcome: 'ignored' as ChargeOutcome };
    }

    const outcome = await this.settleCharge(event.data);
    return { received: true, outcome };
  }

  /**
   * Applies a successful charge to its order. Safe to call any number of times
   * for the same charge: the order row is claimed with a conditional update, so
   * only the first delivery changes anything.
   */
  async settleCharge(charge: PaystackChargeData): Promise<ChargeOutcome> {
    if (charge.status !== 'success' || !charge.reference) return 'ignored';

    const order = await this.prisma.order.findUnique({
      where: { reference: charge.reference },
      include: { items: true },
    });

    if (!order) {
      this.logger.warn(`charge.success for unknown reference '${charge.reference}'.`);
      return 'unknown_reference';
    }

    if (!UNSETTLED.includes(order.paymentStatus)) return 'duplicate';

    const paidAt = charge.paid_at ? new Date(charge.paid_at) : new Date();
    const payment = {
      paidAmount: typeof charge.amount === 'number' ? charge.amount : null,
      paymentChannel: charge.channel ?? null,
      paystackTransactionId: charge.id != null ? String(charge.id) : null,
    };
    const unsettled = { id: order.id, paymentStatus: { in: UNSETTLED } };

    // 1. The charge must match what this order asked for, to the kobo.
    if (charge.amount !== order.totalAmount || charge.currency !== order.currencyCode) {
      await this.prisma.order.updateMany({
        where: unsettled,
        data: {
          ...payment,
          paymentStatus: PaymentStatus.MISMATCH,
          paymentNote:
            `Charge of ${charge.amount} ${charge.currency} does not match order total of ` +
            `${order.totalAmount} ${order.currencyCode}. Needs manual review.`,
        },
      });
      this.logger.warn(`Charge mismatch for order ${order.reference}; order left unpaid.`);
      return 'mismatch';
    }

    // 2. A cancelled order cannot be fulfilled, but the money still arrived.
    if (!PAYABLE.includes(order.status)) {
      await this.prisma.order.updateMany({
        where: unsettled,
        data: {
          ...payment,
          paidAt,
          paymentStatus: PaymentStatus.REFUND_REQUIRED,
          paymentNote: `Payment received while order was ${order.status}. Refund required.`,
        },
      });
      return 'not_payable';
    }

    // 3. Mark PAID and take the stock, atomically.
    try {
      return await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
          where: { ...unsettled, status: { in: PAYABLE } },
          data: {
            ...payment,
            paidAt,
            status: OrderStatus.PAID,
            paymentStatus: PaymentStatus.PAID,
          },
        });

        // Another delivery of this webhook got here first.
        if (claimed.count !== 1) return 'duplicate' as ChargeOutcome;

        // Stable ordering avoids deadlocks between orders sharing variants.
        const items = [...order.items].sort((a, b) =>
          (a.variantId ?? '').localeCompare(b.variantId ?? ''),
        );

        for (const item of items) {
          if (!item.variantId) throw new OutOfStockError();

          // Conditional decrement: under concurrency the database re-checks the
          // stock guard after any competing update commits, so the last unit
          // can only be taken once.
          const taken = await tx.inventoryItem.updateMany({
            where: { variantId: item.variantId, quantityOnHand: { gte: item.quantity } },
            data: { quantityOnHand: { decrement: item.quantity } },
          });

          if (taken.count !== 1) throw new OutOfStockError();

          const inventory = await tx.inventoryItem.findUniqueOrThrow({
            where: { variantId: item.variantId },
            select: { id: true },
          });

          await tx.inventoryMovement.create({
            data: {
              inventoryItemId: inventory.id,
              delta: -item.quantity,
              reason: MovementReason.SALE_DEDUCTED,
              referenceId: order.reference,
            },
          });
        }

        return 'paid' as ChargeOutcome;
      }, SETTLE_TX_OPTIONS);
    } catch (err) {
      if (!(err instanceof OutOfStockError)) throw err;

      // The transaction rolled back, so the order is still unsettled. The
      // customer has paid for stock that is gone: cancel and flag for refund.
      await this.prisma.order.updateMany({
        where: unsettled,
        data: {
          ...payment,
          paidAt,
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          paymentStatus: PaymentStatus.REFUND_REQUIRED,
          paymentNote: 'Payment received but stock ran out before it arrived. Refund required.',
        },
      });
      this.logger.warn(`Order ${order.reference} paid but out of stock; refund required.`);
      return 'out_of_stock';
    }
  }

  // ── Expiry ─────────────────────────────────────────────────────────────────

  /** Expires PENDING orders (including those waiting for a transfer) past their deadline. */
  async expireStale(now: Date = new Date()): Promise<number> {
    const result = await this.prisma.order.updateMany({
      where: {
        status: OrderStatus.PENDING,
        paymentStatus: { in: UNSETTLED },
        expiresAt: { lt: now },
      },
      data: { status: OrderStatus.EXPIRED, expiredAt: now },
    });

    return result.count;
  }

  // ── Customer ───────────────────────────────────────────────────────────────

  /** A signed-in customer's own orders. Scoped by userId — never by request input. */
  async listForCustomer(userId: string, page = 1, limit = 10) {
    const where: Prisma.OrderWhereInput = { userId };
    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: { orderBy: { createdAt: 'asc' } } },
      }),
    ]);

    return {
      data: orders.map((order) => this.shapePublic(order)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async listForAdmin(query: OrderQueryDto) {
    const { page = 1, limit = 20, search, status, paymentStatus } = query;

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { items: true } } },
      }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getForAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });

    if (!order) throw new NotFoundException('Order not found.');

    return { ...order, allowedTransitions: ADMIN_TRANSITIONS[order.status] };
  }

  async updateStatus(id: string, next: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found.');

    if (!ADMIN_TRANSITIONS[order.status].includes(next)) {
      throw new UnprocessableEntityException(
        `An order cannot move from ${order.status} to ${next}.`,
      );
    }

    const now = new Date();
    const data: Prisma.OrderUpdateManyMutationInput = { status: next };
    if (next === OrderStatus.SHIPPED) data.shippedAt = now;
    if (next === OrderStatus.DELIVERED) data.deliveredAt = now;
    if (next === OrderStatus.CANCELLED) data.cancelledAt = now;

    const wasPaid = order.status === OrderStatus.PAID;
    if (wasPaid && next === OrderStatus.CANCELLED) {
      data.paymentStatus = PaymentStatus.REFUND_REQUIRED;
      data.paymentNote = 'Cancelled after payment. Refund required.';
    }

    await this.prisma.$transaction(async (tx) => {
      // Guarded on the status we read, so a concurrent webhook or admin action wins cleanly.
      const moved = await tx.order.updateMany({ where: { id, status: order.status }, data });

      if (moved.count !== 1) {
        throw new ConflictException('This order was just updated. Refresh and try again.');
      }

      // Cancelling a paid, unshipped order puts its stock back on the shelf.
      if (wasPaid && next === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          if (!item.variantId) continue;

          const inventory = await tx.inventoryItem.update({
            where: { variantId: item.variantId },
            data: { quantityOnHand: { increment: item.quantity } },
            select: { id: true },
          });

          await tx.inventoryMovement.create({
            data: {
              inventoryItemId: inventory.id,
              delta: item.quantity,
              reason: MovementReason.RETURN,
              referenceId: order.reference,
              note: 'Paid order cancelled',
            },
          });
        }
      }
    });

    return this.getForAdmin(id);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private generateReference(): string {
    const time = Date.now().toString(36).toUpperCase();
    const random = randomBytes(10).toString('hex').toUpperCase();
    return `OGN-${time}-${random}`;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    return `${local.slice(0, 2)}***@${domain}`;
  }

  /** Customer-facing view: no internal ids, payment internals or full contact details. */
  private shapePublic(order: Prisma.OrderGetPayload<{ include: { items: true } }>) {
    const payable = order.status === OrderStatus.PENDING && UNSETTLED.includes(order.paymentStatus);

    return {
      reference: order.reference,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currencyCode: order.currencyCode,
      subtotalAmount: order.subtotalAmount,
      shippingAmount: order.shippingAmount,
      totalAmount: order.totalAmount,
      customerName: order.customerName,
      email: this.maskEmail(order.email),
      shippingCity: order.city,
      shippingState: order.state,
      // Let the customer resume an unfinished payment (popup, or hosted page as fallback).
      authorizationUrl: payable ? order.authorizationUrl : null,
      accessCode: payable ? order.paystackAccessCode : null,
      createdAt: order.createdAt,
      expiresAt: order.expiresAt,
      paidAt: order.paidAt,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName,
        sellingUnit: item.sellingUnit,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        unitPriceAmount: item.unitPriceAmount,
        lineTotalAmount: item.lineTotalAmount,
      })),
    };
  }
}
