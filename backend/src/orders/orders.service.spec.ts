import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { createHmac } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { PaystackService } from '../payments/paystack.service';
import { OrdersService } from './orders.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

const SECRET = 'sk_test_unit_test_secret';
const CALLBACK_URL = 'http://localhost:3000/checkout/callback';

const env: Record<string, unknown> = {
  PAYSTACK_SECRET_KEY: SECRET,
  PAYSTACK_CALLBACK_URL: CALLBACK_URL,
  ORDER_PAYMENT_EXPIRY_MINUTES: 30,
};

const config = {
  get: jest.fn((key: string) => env[key]),
  getOrThrow: jest.fn((key: string) => env[key]),
} as unknown as ConfigService;

const makeOrder = (overrides: any = {}) => ({
  id: 'order-1',
  reference: 'OGN-TEST-1',
  status: OrderStatus.PENDING,
  paymentStatus: PaymentStatus.UNPAID,
  currencyCode: 'NGN',
  subtotalAmount: 1_000_000,
  shippingAmount: 0,
  totalAmount: 1_000_000,
  email: 'buyer@example.com',
  customerName: 'Ada Buyer',
  city: 'Lagos',
  state: 'Lagos',
  authorizationUrl: 'https://checkout.paystack.com/x',
  paystackAccessCode: 'ac_test',
  paymentChannel: null,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 60_000),
  paidAt: null,
  items: [
    {
      id: 'oi-1',
      variantId: 'var-1',
      productName: 'Ankara',
      variantName: 'Default',
      sellingUnit: 'METER',
      imageUrl: null,
      quantity: 2,
      unitPriceAmount: 500_000,
      lineTotalAmount: 1_000_000,
    },
  ],
  ...overrides,
});

const chargeEvent = (data: any = {}) => ({
  event: 'charge.success',
  data: {
    id: 99001,
    status: 'success',
    reference: 'OGN-TEST-1',
    amount: 1_000_000,
    currency: 'NGN',
    channel: 'card',
    paid_at: '2026-11-14T10:00:00.000Z',
    ...data,
  },
});

const signed = (payload: unknown) => {
  const raw = Buffer.from(JSON.stringify(payload));
  return { raw, signature: createHmac('sha512', SECRET).update(raw).digest('hex') };
};

const mockPrisma: any = {
  order: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  cart: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  inventoryItem: { updateMany: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
  inventoryMovement: { create: jest.fn() },
  $transaction: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;
  let paystack: PaystackService;

  beforeEach(() => {
    jest.resetAllMocks();
    (config.get as jest.Mock).mockImplementation((key: string) => env[key]);
    (config.getOrThrow as jest.Mock).mockImplementation((key: string) => env[key]);

    // Interactive transactions run against the same mock; array form resolves all.
    mockPrisma.$transaction.mockImplementation((arg: any) =>
      typeof arg === 'function' ? arg(mockPrisma) : Promise.all(arg),
    );
    mockPrisma.inventoryItem.findUniqueOrThrow.mockResolvedValue({ id: 'inv-1' });

    paystack = new PaystackService(config);
    service = new OrdersService(mockPrisma as PrismaService, paystack, config);
  });

  // ── Webhook: signature ─────────────────────────────────────────────────────

  describe('handlePaystackWebhook — signature', () => {
    it('rejects a bad signature without touching the database', async () => {
      const { raw } = signed(chargeEvent());

      await expect(service.handlePaystackWebhook(raw, 'deadbeef')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.order.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a missing signature', async () => {
      const { raw } = signed(chargeEvent());

      await expect(service.handlePaystackWebhook(raw, undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a body that was changed after signing', async () => {
      const { signature } = signed(chargeEvent());
      const { raw: tampered } = signed(chargeEvent({ amount: 1 }));

      await expect(service.handlePaystackWebhook(tampered, signature)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('acknowledges correctly signed events it does not handle', async () => {
      const { raw, signature } = signed({ event: 'transfer.success', data: {} });

      await expect(service.handlePaystackWebhook(raw, signature)).resolves.toEqual({
        received: true,
        outcome: 'ignored',
      });
      expect(mockPrisma.order.findUnique).not.toHaveBeenCalled();
    });
  });

  // ── Webhook: charge.success ────────────────────────────────────────────────

  describe('handlePaystackWebhook — charge.success', () => {
    it('marks the order PAID and decrements inventory in one transaction', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.inventoryItem.updateMany.mockResolvedValue({ count: 1 });
      const { raw, signature } = signed(chargeEvent());

      const result = await service.handlePaystackWebhook(raw, signature);

      expect(result.outcome).toBe('paid');
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'order-1',
            status: { in: [OrderStatus.PENDING, OrderStatus.EXPIRED] },
          }),
          data: expect.objectContaining({
            status: OrderStatus.PAID,
            paymentStatus: PaymentStatus.PAID,
            paidAmount: 1_000_000,
            paystackTransactionId: '99001',
          }),
        }),
      );
      expect(mockPrisma.inventoryItem.updateMany).toHaveBeenCalledWith({
        where: { variantId: 'var-1', quantityOnHand: { gte: 2 } },
        data: { quantityOnHand: { decrement: 2 } },
      });
      expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ delta: -2, reason: 'SALE_DEDUCTED', referenceId: 'OGN-TEST-1' }),
      });
    });

    it('is idempotent: a duplicate delivery after settlement changes nothing', async () => {
      const { raw, signature } = signed(chargeEvent());

      // First delivery settles the order.
      mockPrisma.order.findUnique.mockResolvedValueOnce(makeOrder());
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.inventoryItem.updateMany.mockResolvedValue({ count: 1 });
      expect((await service.handlePaystackWebhook(raw, signature)).outcome).toBe('paid');

      // Second delivery sees the settled order.
      mockPrisma.order.findUnique.mockResolvedValueOnce(
        makeOrder({ status: OrderStatus.PAID, paymentStatus: PaymentStatus.PAID }),
      );
      expect((await service.handlePaystackWebhook(raw, signature)).outcome).toBe('duplicate');

      expect(mockPrisma.order.updateMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.inventoryItem.updateMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledTimes(1);
    });

    it('is idempotent under a race: the delivery that loses the claim takes no stock', async () => {
      // Both deliveries read the order as unpaid, but only one wins the conditional update.
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      mockPrisma.order.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });
      mockPrisma.inventoryItem.updateMany.mockResolvedValue({ count: 1 });
      const { raw, signature } = signed(chargeEvent());

      const outcomes = await Promise.all([
        service.handlePaystackWebhook(raw, signature),
        service.handlePaystackWebhook(raw, signature),
      ]);

      expect(outcomes.map((o) => o.outcome).sort()).toEqual(['duplicate', 'paid']);
      expect(mockPrisma.inventoryItem.updateMany).toHaveBeenCalledTimes(1);
    });

    it('does not mark PAID or touch stock when the amount does not match', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      const { raw, signature } = signed(chargeEvent({ amount: 100_000 }));

      const result = await service.handlePaystackWebhook(raw, signature);

      expect(result.outcome).toBe('mismatch');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockPrisma.inventoryItem.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.order.updateMany).toHaveBeenCalledTimes(1);
      const { data } = mockPrisma.order.updateMany.mock.calls[0][0];
      expect(data.paymentStatus).toBe(PaymentStatus.MISMATCH);
      expect(data.paidAmount).toBe(100_000);
      expect(data.status).toBeUndefined(); // order stays PENDING
    });

    it('treats an overpayment as a mismatch too', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      const { raw, signature } = signed(chargeEvent({ amount: 1_000_001 }));

      expect((await service.handlePaystackWebhook(raw, signature)).outcome).toBe('mismatch');
      expect(mockPrisma.inventoryItem.updateMany).not.toHaveBeenCalled();
    });

    it('does not mark PAID when the currency does not match', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      const { raw, signature } = signed(chargeEvent({ currency: 'USD' }));

      expect((await service.handlePaystackWebhook(raw, signature)).outcome).toBe('mismatch');
      expect(mockPrisma.inventoryItem.updateMany).not.toHaveBeenCalled();
    });

    it('ignores a charge whose reference matches no order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      const { raw, signature } = signed(chargeEvent({ reference: 'SOMEONE-ELSE' }));

      const result = await service.handlePaystackWebhook(raw, signature);

      expect(result.outcome).toBe('unknown_reference');
      expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.inventoryItem.updateMany).not.toHaveBeenCalled();
    });

    it('cancels and flags a refund when stock is gone by the time payment lands', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.inventoryItem.updateMany.mockResolvedValue({ count: 0 });
      const { raw, signature } = signed(chargeEvent());

      const result = await service.handlePaystackWebhook(raw, signature);

      expect(result.outcome).toBe('out_of_stock');
      expect(mockPrisma.inventoryMovement.create).not.toHaveBeenCalled();
      const last = mockPrisma.order.updateMany.mock.calls.at(-1)[0];
      expect(last.data.status).toBe(OrderStatus.CANCELLED);
      expect(last.data.paymentStatus).toBe(PaymentStatus.REFUND_REQUIRED);
    });

    it('honours a late bank transfer on an EXPIRED order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        makeOrder({ status: OrderStatus.EXPIRED, paymentStatus: PaymentStatus.AWAITING_TRANSFER }),
      );
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.inventoryItem.updateMany.mockResolvedValue({ count: 1 });
      const { raw, signature } = signed(chargeEvent({ channel: 'bank_transfer' }));

      expect((await service.handlePaystackWebhook(raw, signature)).outcome).toBe('paid');
    });

    it('flags a refund instead of fulfilling when the order was cancelled', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder({ status: OrderStatus.CANCELLED }));
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      const { raw, signature } = signed(chargeEvent());

      const result = await service.handlePaystackWebhook(raw, signature);

      expect(result.outcome).toBe('not_payable');
      expect(mockPrisma.inventoryItem.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.order.updateMany.mock.calls[0][0].data.paymentStatus).toBe(
        PaymentStatus.REFUND_REQUIRED,
      );
    });
  });

  // ── Checkout ───────────────────────────────────────────────────────────────

  describe('createFromCart', () => {
    const dto = {
      email: 'buyer@example.com',
      customerName: 'Ada Buyer',
      phone: '+2348012345678',
      addressLine1: '1 Fabric Lane',
      city: 'Lagos',
      state: 'Lagos',
    };

    const makeCart = (variant: any = {}) => ({
      id: 'cart-1',
      userId: null,
      guestToken: 'guest-1',
      status: CartStatus.ACTIVE,
      items: [
        {
          quantity: 2,
          unitPriceAmount: 1, // stale cart snapshot — must not be used
          variant: {
            id: 'var-1',
            name: 'Default',
            sku: 'SKU-1',
            isActive: true,
            priceAmount: 600_000,
            salePriceAmount: 500_000,
            currencyCode: 'NGN',
            inventory: { quantityOnHand: 5, quantityReserved: 0 },
            images: [],
            product: { name: 'Ankara', status: 'PUBLISHED', sellingUnit: 'METER', images: [] },
            ...variant,
          },
        },
      ],
    });

    it('converts the cart, snapshots current prices and initializes Paystack in kobo', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(makeCart());
      mockPrisma.cart.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.order.create.mockImplementation(async ({ data }: any) => ({ id: 'order-1', ...data }));
      mockPrisma.order.update.mockImplementation(async () => makeOrder());
      const init = jest.spyOn(paystack, 'initializeTransaction').mockResolvedValue({
        authorizationUrl: 'https://checkout.paystack.com/x',
        accessCode: 'ac',
        reference: 'ref',
      });

      const result = await service.createFromCart(dto, { guestToken: 'guest-1' });

      expect(mockPrisma.cart.updateMany).toHaveBeenCalledWith({
        where: { id: 'cart-1', status: CartStatus.ACTIVE },
        data: { status: CartStatus.CONVERTED, guestToken: null, userId: null },
      });

      const created = mockPrisma.order.create.mock.calls[0][0].data;
      expect(created.totalAmount).toBe(1_000_000);
      expect(created.currencyCode).toBe('NGN');
      expect(created.items.create[0]).toMatchObject({
        productName: 'Ankara',
        unitPriceAmount: 500_000,
        lineTotalAmount: 1_000_000,
      });

      expect(init).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1_000_000,
          currency: 'NGN',
          reference: created.reference,
          callbackUrl: CALLBACK_URL,
        }),
      );
      expect(created.reference).toMatch(/^OGN-[0-9A-Z]+-[0-9A-F]{20}$/);
      expect(result.authorizationUrl).toBe('https://checkout.paystack.com/x');
      expect(result.accessCode).toBe('ac');
    });

    it('rejects an empty or already-converted cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue({ ...makeCart(), status: CartStatus.CONVERTED });

      await expect(service.createFromCart(dto, { guestToken: 'guest-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a duplicate submission that loses the cart claim', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(makeCart());
      mockPrisma.cart.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.createFromCart(dto, { guestToken: 'guest-1' })).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.order.create).not.toHaveBeenCalled();
    });

    it('rejects lines that are not priced in NGN', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(makeCart({ currencyCode: 'GBP' }));

      await expect(service.createFromCart(dto, { guestToken: 'guest-1' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects when the cart asks for more than is in stock', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        makeCart({ inventory: { quantityOnHand: 1, quantityReserved: 0 } }),
      );

      await expect(service.createFromCart(dto, { guestToken: 'guest-1' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('uses the 1440-minute default when ORDER_PAYMENT_EXPIRY_MINUTES is blank', async () => {
      // Simulates a misconfigured env var (set but empty string).
      // Number('') === 0, so the old code would expire the order instantly.
      // The fix: parseInt('', 10) is NaN, and NaN || 1440 === 1440.
      (config.get as jest.Mock).mockImplementation((k: string) =>
        k === 'ORDER_PAYMENT_EXPIRY_MINUTES' ? '' : env[k],
      );
      mockPrisma.cart.findUnique.mockResolvedValue(makeCart());
      mockPrisma.cart.updateMany.mockResolvedValue({ count: 1 });
      let capturedExpiresAt: Date | undefined;
      mockPrisma.order.create.mockImplementation(async ({ data }: any) => {
        capturedExpiresAt = data.expiresAt;
        return { id: 'order-1', ...data };
      });
      jest.spyOn(paystack, 'initializeTransaction').mockResolvedValue({
        authorizationUrl: 'https://checkout.paystack.com/x',
        accessCode: 'ac',
        reference: 'ref',
      });
      mockPrisma.order.update.mockImplementation(async () => makeOrder());

      const before = Date.now();
      await service.createFromCart(dto, { guestToken: 'guest-1' });

      expect(capturedExpiresAt).toBeDefined();
      const expiryMs = capturedExpiresAt!.getTime() - before;
      const expectedMs = 1440 * 60 * 1000;
      // Allow a few ms of test execution time either side.
      expect(expiryMs).toBeGreaterThanOrEqual(expectedMs - 100);
      expect(expiryMs).toBeLessThanOrEqual(expectedMs + 500);
    });

    it('logs the access code and re-throws when storing Paystack codes fails', async () => {
      // Covers the window where Paystack init succeeds but the follow-up
      // order.update (to persist accessCode + authorizationUrl) hits a DB error.
      // The order stays PENDING with a live Paystack transaction.
      // We log the access code so support can share the authorization URL manually.
      mockPrisma.cart.findUnique.mockResolvedValue(makeCart());
      mockPrisma.cart.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.order.create.mockImplementation(async ({ data }: any) => ({ id: 'order-1', ...data }));
      jest.spyOn(paystack, 'initializeTransaction').mockResolvedValue({
        authorizationUrl: 'https://checkout.paystack.com/x',
        accessCode: 'ac_xyz_123',
        reference: 'OGN-TEST-1',
      });
      // Simulate a transient DB failure when saving the codes.
      mockPrisma.order.update.mockRejectedValue(new Error('DB connection lost'));
      const errorSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});

      await expect(service.createFromCart(dto, { guestToken: 'guest-1' })).rejects.toThrow(
        'DB connection lost',
      );

      // The access code must appear in the log so support can recover.
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('ac_xyz_123'));
      // The order cleanup path (cart restore) must NOT run — Paystack init succeeded.
      expect(mockPrisma.cart.update).not.toHaveBeenCalled();
    });

    it('voids the order and restores the cart if Paystack initialization fails', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(makeCart());
      mockPrisma.cart.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.order.create.mockImplementation(async ({ data }: any) => ({ id: 'order-1', ...data }));
      jest.spyOn(paystack, 'initializeTransaction').mockRejectedValue(new Error('paystack down'));

      await expect(service.createFromCart(dto, { guestToken: 'guest-1' })).rejects.toThrow(
        'paystack down',
      );

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.CANCELLED }) }),
      );
      expect(mockPrisma.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        data: { status: CartStatus.ACTIVE, guestToken: 'guest-1', userId: null },
      });
    });
  });

  // ── Display verification ───────────────────────────────────────────────────

  describe('verifyForDisplay', () => {
    it('never marks an order PAID, even when Paystack reports success', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      jest.spyOn(paystack, 'verifyTransaction').mockResolvedValue({
        status: 'success',
        reference: 'OGN-TEST-1',
        amount: 1_000_000,
        currency: 'NGN',
        channel: 'card',
        paidAt: null,
        gatewayResponse: 'Successful',
      });

      const result = await service.verifyForDisplay('OGN-TEST-1');

      expect(result.payment.state).toBe('confirming');
      expect(result.order.status).toBe(OrderStatus.PENDING);
      expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('keeps the order PENDING and flags it as waiting for a bank transfer', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.order.findUniqueOrThrow.mockResolvedValue(
        makeOrder({ paymentStatus: PaymentStatus.AWAITING_TRANSFER }),
      );
      jest.spyOn(paystack, 'verifyTransaction').mockResolvedValue({
        status: 'pending',
        reference: 'OGN-TEST-1',
        amount: 1_000_000,
        currency: 'NGN',
        channel: 'bank_transfer',
        paidAt: null,
        gatewayResponse: null,
      });

      const result = await service.verifyForDisplay('OGN-TEST-1');

      expect(result.payment.state).toBe('awaiting_transfer');
      expect(result.order.status).toBe(OrderStatus.PENDING);
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: OrderStatus.PENDING, paymentStatus: PaymentStatus.UNPAID },
        data: { paymentStatus: PaymentStatus.AWAITING_TRANSFER, paymentChannel: 'bank_transfer' },
      });
    });

    it('falls back to local state and logs a warning when Paystack is unreachable', async () => {
      // The frontend polls this endpoint every 3 seconds while in "confirming" state.
      // If Paystack goes down mid-poll the endpoint must still return a usable state
      // (not throw 500) and must log the failure so we know the gateway is having issues.
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder());
      jest
        .spyOn(paystack, 'verifyTransaction')
        .mockRejectedValue(new Error('Paystack timeout'));
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => {});

      // Should resolve (not throw) even though Paystack is down.
      const result = await service.verifyForDisplay('OGN-TEST-1');

      expect(result.payment.state).toBe('not_completed');
      expect(result.order.status).toBe(OrderStatus.PENDING);
      // Warning must include the reference so we can correlate it in logs.
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('OGN-TEST-1'));
      // No DB writes: we never change the order state from a display-only call.
      expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('does not expose the full email address', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        makeOrder({ status: OrderStatus.PAID, paymentStatus: PaymentStatus.PAID }),
      );

      const result = await service.verifyForDisplay('OGN-TEST-1');

      expect(result.payment.state).toBe('paid');
      expect(result.order.email).toBe('bu***@example.com');
      expect(result.order.authorizationUrl).toBeNull();
      expect(result.order.accessCode).toBeNull(); // settled orders can't be paid again
    });
  });

  // ── Expiry + admin transitions ─────────────────────────────────────────────

  describe('expireStale', () => {
    it('expires only unpaid PENDING orders past their deadline', async () => {
      mockPrisma.order.updateMany.mockResolvedValue({ count: 3 });
      const now = new Date('2026-11-14T12:00:00Z');

      await expect(service.expireStale(now)).resolves.toBe(3);
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
        where: {
          status: OrderStatus.PENDING,
          paymentStatus: { in: [PaymentStatus.UNPAID, PaymentStatus.AWAITING_TRANSFER] },
          expiresAt: { lt: now },
        },
        data: { status: OrderStatus.EXPIRED, expiredAt: now },
      });
    });
  });

  describe('updateStatus', () => {
    it.each([
      [OrderStatus.PENDING, OrderStatus.PAID],
      [OrderStatus.PENDING, OrderStatus.SHIPPED],
      [OrderStatus.PAID, OrderStatus.DELIVERED],
      [OrderStatus.EXPIRED, OrderStatus.PAID],
      [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    ])('rejects %s → %s', async (from, to) => {
      mockPrisma.order.findUnique.mockResolvedValue(makeOrder({ status: from }));

      await expect(service.updateStatus('order-1', to)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('restocks and flags a refund when a PAID order is cancelled', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        makeOrder({ status: OrderStatus.PAID, paymentStatus: PaymentStatus.PAID }),
      );
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.inventoryItem.update.mockResolvedValue({ id: 'inv-1' });

      await service.updateStatus('order-1', OrderStatus.CANCELLED);

      expect(mockPrisma.order.updateMany.mock.calls[0][0].data).toMatchObject({
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUND_REQUIRED,
      });
      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { quantityOnHand: { increment: 2 } } }),
      );
    });
  });
});
