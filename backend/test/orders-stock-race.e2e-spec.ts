import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { PrismaService } from '../src/database/prisma.service';
import { PaystackService } from '../src/payments/paystack.service';
import { OrdersService } from '../src/orders/orders.service';

dotenv.config();


const RUN = `race-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

// The database may be remote; allow for network round-trips.
jest.setTimeout(120_000);

describeDb('Orders — last-item stock race (database)', () => {
  const prisma = new PrismaClient();
  const config = {
    get: () => undefined,
    getOrThrow: () => 'sk_test_not_used_in_this_test',
  } as unknown as ConfigService;
  const service = new OrdersService(
    prisma as unknown as PrismaService,
    new PaystackService(config),
    config,
  );

  let productId: string;
  let variantId: string;
  let inventoryItemId: string;
  const orderIds: string[] = [];

  const createOrder = async (n: number, quantity = 1) => {
    const order = await prisma.order.create({
      data: {
        reference: `${RUN}-${n}`,
        email: `buyer${n}@example.com`,
        customerName: `Race Buyer ${n}`,
        phone: '+2348000000000',
        addressLine1: '1 Test Street',
        city: 'Lagos',
        state: 'Lagos',
        subtotalAmount: 500_000 * quantity,
        totalAmount: 500_000 * quantity,
        expiresAt: new Date(Date.now() + 3_600_000),
        items: {
          create: [
            {
              variantId,
              productName: 'Race Test Fabric',
              variantName: 'Default',
              sellingUnit: 'METER',
              quantity,
              unitPriceAmount: 500_000,
              lineTotalAmount: 500_000 * quantity,
            },
          ],
        },
      },
    });
    orderIds.push(order.id);
    return order;
  };

  const charge = (order: { reference: string; totalAmount: number }, id: number) => ({
    id,
    status: 'success',
    reference: order.reference,
    amount: order.totalAmount,
    currency: 'NGN',
    channel: 'bank_transfer',
    paid_at: new Date().toISOString(),
  });

  const setStock = (quantityOnHand: number) =>
    prisma.inventoryItem.update({ where: { variantId }, data: { quantityOnHand } });

  beforeAll(async () => {
    const product = await prisma.product.create({
      data: {
        name: `Race Test Fabric ${RUN}`,
        slug: RUN,
        status: 'DRAFT', // never visible on the storefront
        variants: {
          create: [{ name: 'Default', priceAmount: 500_000, currencyCode: 'NGN', isDefault: true }],
        },
      },
      include: { variants: true },
    });
    productId = product.id;
    variantId = product.variants[0].id;

    const inventory = await prisma.inventoryItem.create({
      data: { variantId, quantityOnHand: 1 },
    });
    inventoryItemId = inventory.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.inventoryMovement.deleteMany({ where: { inventoryItemId } });
    await prisma.inventoryItem.deleteMany({ where: { id: inventoryItemId } });
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.$disconnect();
  });

  it('sells the last unit exactly once when two paid orders settle concurrently', async () => {
    await setStock(1);
    const [a, b] = await Promise.all([createOrder(1), createOrder(2)]);

    const outcomes = await Promise.all([
      service.settleCharge(charge(a, 1001)),
      service.settleCharge(charge(b, 1002)),
    ]);

    expect([...outcomes].sort()).toEqual(['out_of_stock', 'paid']);

    const inventory = await prisma.inventoryItem.findUniqueOrThrow({ where: { variantId } });
    expect(inventory.quantityOnHand).toBe(0);

    const orders = await prisma.order.findMany({ where: { id: { in: [a.id, b.id] } } });
    const winner = orders.find((o) => o.status === OrderStatus.PAID)!;
    const loser = orders.find((o) => o.status !== OrderStatus.PAID)!;

    expect(winner.paymentStatus).toBe(PaymentStatus.PAID);
    expect(loser.status).toBe(OrderStatus.CANCELLED);
    expect(loser.paymentStatus).toBe(PaymentStatus.REFUND_REQUIRED);
    expect(loser.paidAmount).toBe(loser.totalAmount);

    // Exactly one sale was written to the audit log.
    const movements = await prisma.inventoryMovement.findMany({
      where: { inventoryItemId, referenceId: { in: [a.reference, b.reference] } },
    });
    expect(movements).toHaveLength(1);
    expect(movements[0].referenceId).toBe(winner.reference);
    expect(movements[0].delta).toBe(-1);
  });

  it('never oversells when many paid orders race for limited stock', async () => {
    await setStock(3);
    const orders = await Promise.all([11, 12, 13, 14, 15, 16, 17, 18].map((n) => createOrder(n)));

    const outcomes = await Promise.all(
      orders.map((o, i) => service.settleCharge(charge(o, 2000 + i))),
    );

    expect(outcomes.filter((o) => o === 'paid')).toHaveLength(3);
    expect(outcomes.filter((o) => o === 'out_of_stock')).toHaveLength(5);

    const inventory = await prisma.inventoryItem.findUniqueOrThrow({ where: { variantId } });
    expect(inventory.quantityOnHand).toBe(0);
  });

  it('decrements stock once when the same webhook is delivered concurrently', async () => {
    await setStock(5);
    const order = await createOrder(21, 2);

    const outcomes = await Promise.all(
      Array.from({ length: 5 }, () => service.settleCharge(charge(order, 3001))),
    );

    expect(outcomes.filter((o) => o === 'paid')).toHaveLength(1);
    expect(outcomes.filter((o) => o === 'duplicate')).toHaveLength(4);

    const inventory = await prisma.inventoryItem.findUniqueOrThrow({ where: { variantId } });
    expect(inventory.quantityOnHand).toBe(3);

    const movements = await prisma.inventoryMovement.count({
      where: { inventoryItemId, referenceId: order.reference },
    });
    expect(movements).toBe(1);
  });

  it('leaves stock untouched when the paid amount does not match', async () => {
    await setStock(2);
    const order = await createOrder(31);

    const outcome = await service.settleCharge({ ...charge(order, 4001), amount: 100 });

    expect(outcome).toBe('mismatch');
    const fresh = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(fresh.status).toBe(OrderStatus.PENDING);
    expect(fresh.paymentStatus).toBe(PaymentStatus.MISMATCH);

    const inventory = await prisma.inventoryItem.findUniqueOrThrow({ where: { variantId } });
    expect(inventory.quantityOnHand).toBe(2);
  });
});
