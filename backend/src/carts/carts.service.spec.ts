import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CartStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CartsService } from './carts.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeVariant = (overrides: any = {}) => ({
  id: 'var-1',
  name: 'White',
  sku: 'SKU-001',
  isActive: true,
  priceAmount: 895,
  salePriceAmount: null,
  currencyCode: 'GBP',
  attributes: { colour: 'White' },
  images: [],
  product: {
    id: 'prod-1',
    name: 'Demo Cotton Poplin',
    slug: 'demo-cotton-poplin',
    status: 'PUBLISHED',
    sellingUnit: 'METER',
    minOrderQty: 1,
    qtyIncrement: 1,
  },
  ...overrides,
});

const makeCartItem = (overrides: any = {}) => ({
  id: 'item-1',
  cartId: 'cart-1',
  variantId: 'var-1',
  quantity: 2,
  unitPriceAmount: 895,
  currencyCode: 'GBP',
  createdAt: new Date(),
  updatedAt: new Date(),
  variant: makeVariant(),
  ...overrides,
});

const makeCart = (overrides: any = {}) => ({
  id: 'cart-1',
  userId: 'user-1',
  guestToken: null,
  status: CartStatus.ACTIVE,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockInventory = {
  ensureAvailable: jest.fn(),
};

const mockPrisma = {
  cart: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  cartItem: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  productVariant: {
    findUnique: jest.fn(),
  },
};

describe('CartsService', () => {
  let service: CartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InventoryService, useValue: mockInventory },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
    jest.clearAllMocks();
  });

  // ── getOrCreateForUser ────────────────────────────────────────────────────

  describe('getOrCreateForUser', () => {
    it('returns existing cart when one already exists', async () => {
      const cart = makeCart();
      mockPrisma.cart.findUnique.mockResolvedValue(cart);

      const result = await service.getOrCreateForUser('user-1');

      expect(result.id).toBe('cart-1');
      expect(mockPrisma.cart.create).not.toHaveBeenCalled();
    });

    it('creates a new cart when none exists', async () => {
      const cart = makeCart();
      mockPrisma.cart.findUnique.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue(cart);

      await service.getOrCreateForUser('user-1');

      expect(mockPrisma.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', status: CartStatus.ACTIVE }),
        }),
      );
    });
  });

  // ── getOrCreateForGuest ───────────────────────────────────────────────────

  describe('getOrCreateForGuest', () => {
    it('creates a guest cart with the provided token', async () => {
      const cart = makeCart({ userId: null, guestToken: 'tok-abc' });
      mockPrisma.cart.findUnique.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue(cart);

      await service.getOrCreateForGuest('tok-abc');

      expect(mockPrisma.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ guestToken: 'tok-abc' }),
        }),
      );
    });
  });

  // ── addItem ───────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('creates a new cart item and returns updated cart', async () => {
      const variant = makeVariant();
      const cartAfter = makeCart({ items: [makeCartItem()] });

      mockPrisma.productVariant.findUnique.mockResolvedValue(variant);
      mockInventory.ensureAvailable.mockResolvedValue(undefined);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({});
      mockPrisma.cart.update.mockResolvedValue({});
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue(cartAfter);

      const result = await service.addItem('cart-1', { variantId: 'var-1', quantity: 2 });

      expect(mockPrisma.cartItem.create).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('increments quantity when variant already in cart', async () => {
      const variant = makeVariant();
      const existingItem = makeCartItem({ quantity: 2 });
      const cartAfter = makeCart({ items: [makeCartItem({ quantity: 4 })] });

      mockPrisma.productVariant.findUnique.mockResolvedValue(variant);
      mockInventory.ensureAvailable.mockResolvedValue(undefined);
      mockPrisma.cartItem.findUnique.mockResolvedValue(existingItem);
      mockPrisma.cartItem.update.mockResolvedValue({});
      mockPrisma.cart.update.mockResolvedValue({});
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue(cartAfter);

      await service.addItem('cart-1', { variantId: 'var-1', quantity: 2 });

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ quantity: 4 }) }),
      );
    });

    it('uses sale price when set on the variant', async () => {
      const variant = makeVariant({ priceAmount: 1450, salePriceAmount: 1100 });
      const cartAfter = makeCart({ items: [makeCartItem({ unitPriceAmount: 1100 })] });

      mockPrisma.productVariant.findUnique.mockResolvedValue(variant);
      mockInventory.ensureAvailable.mockResolvedValue(undefined);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({});
      mockPrisma.cart.update.mockResolvedValue({});
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue(cartAfter);

      await service.addItem('cart-1', { variantId: 'var-1', quantity: 1 });

      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ unitPriceAmount: 1100 }),
        }),
      );
    });

    it('throws NotFoundException for unknown or inactive variant', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem('cart-1', { variantId: 'bad', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when product is not published', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(
        makeVariant({ product: { ...makeVariant().product, status: 'DRAFT' } }),
      );

      await expect(
        service.addItem('cart-1', { variantId: 'var-1', quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when quantity is below minOrderQty', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(
        makeVariant({ product: { ...makeVariant().product, minOrderQty: 2, qtyIncrement: 1 } }),
      );

      await expect(
        service.addItem('cart-1', { variantId: 'var-1', quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when quantity does not respect increment', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(
        makeVariant({ product: { ...makeVariant().product, minOrderQty: 1, qtyIncrement: 2 } }),
      );

      // quantity=2 is valid (1 + 2*n), quantity=3 would be: (3-1) % 2 = 0 ✓, quantity=2 ✓
      // quantity=2: (2-1)%2 = 1 ✗
      await expect(
        service.addItem('cart-1', { variantId: 'var-1', quantity: 2 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('propagates ConflictException from InventoryService when stock is insufficient', async () => {
      const { ConflictException } = await import('@nestjs/common');
      mockPrisma.productVariant.findUnique.mockResolvedValue(makeVariant());
      mockInventory.ensureAvailable.mockRejectedValue(
        new ConflictException('Insufficient stock'),
      );

      await expect(
        service.addItem('cart-1', { variantId: 'var-1', quantity: 100 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── updateItem ────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('updates quantity and returns refreshed cart', async () => {
      const item = makeCartItem();
      const cartAfter = makeCart({ items: [makeCartItem({ quantity: 5 })] });

      mockPrisma.cartItem.findUnique.mockResolvedValue(item);
      mockInventory.ensureAvailable.mockResolvedValue(undefined);
      mockPrisma.cartItem.update.mockResolvedValue({});
      mockPrisma.cart.update.mockResolvedValue({});
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue(cartAfter);

      const result = await service.updateItem('cart-1', 'item-1', { quantity: 5 });

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { quantity: 5 } }),
      );
      expect(result.items[0].quantity).toBe(5);
    });

    it('throws NotFoundException when item belongs to a different cart', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(makeCartItem({ cartId: 'other-cart' }));

      await expect(
        service.updateItem('cart-1', 'item-1', { quantity: 3 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── removeItem ────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('deletes the item and returns updated cart', async () => {
      const cartAfter = makeCart({ items: [] });

      mockPrisma.cartItem.findUnique.mockResolvedValue(makeCartItem());
      mockPrisma.cartItem.delete.mockResolvedValue({});
      mockPrisma.cart.update.mockResolvedValue({});
      mockPrisma.cart.findUniqueOrThrow.mockResolvedValue(cartAfter);

      const result = await service.removeItem('cart-1', 'item-1');

      expect(mockPrisma.cartItem.delete).toHaveBeenCalled();
      expect(result.items).toHaveLength(0);
    });

    it('throws NotFoundException when item does not exist', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(service.removeItem('cart-1', 'bad-item')).rejects.toThrow(NotFoundException);
    });
  });

  // ── assertOwnership ───────────────────────────────────────────────────────

  describe('assertOwnership', () => {
    it('passes when userId matches cart owner', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(makeCart({ userId: 'user-1' }));

      await expect(service.assertOwnership('cart-1', 'user-1', null)).resolves.not.toThrow();
    });

    it('passes when guestToken matches cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        makeCart({ userId: null, guestToken: 'tok-abc' }),
      );

      await expect(service.assertOwnership('cart-1', null, 'tok-abc')).resolves.not.toThrow();
    });

    it('throws ForbiddenException when neither userId nor guestToken matches', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(
        makeCart({ userId: 'other-user', guestToken: 'other-tok' }),
      );

      await expect(
        service.assertOwnership('cart-1', 'user-1', 'tok-abc'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── shape / subtotal ──────────────────────────────────────────────────────

  describe('cart subtotal calculation', () => {
    it('calculates subtotalAmount as sum of line totals', async () => {
      const cart = makeCart({
        items: [
          makeCartItem({ quantity: 2, unitPriceAmount: 895 }),
          makeCartItem({ id: 'item-2', variantId: 'var-2', quantity: 3, unitPriceAmount: 1450 }),
        ],
      });
      mockPrisma.cart.findUnique.mockResolvedValue(cart);

      const result = await service.getOrCreateForUser('user-1');

      // (2 × 895) + (3 × 1450) = 1790 + 4350 = 6140
      expect(result.subtotalAmount).toBe(6140);
      expect(result.itemCount).toBe(5);
    });
  });
});
