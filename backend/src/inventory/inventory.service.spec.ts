import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MovementReason } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { InventoryService } from './inventory.service';

const makeItem = (overrides: Partial<{
  id: string;
  variantId: string;
  quantityOnHand: number;
  quantityReserved: number;
  updatedAt: Date;
}> = {}) => ({
  id: 'inv-1',
  variantId: 'var-1',
  quantityOnHand: 20,
  quantityReserved: 0,
  updatedAt: new Date(),
  variant: {
    id: 'var-1',
    name: 'White',
    sku: 'SKU-001',
    product: { id: 'prod-1', name: 'Demo Cotton Poplin', slug: 'demo-cotton-poplin' },
  },
  ...overrides,
});

const mockTx = {
  inventoryItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  inventoryMovement: {
    create: jest.fn(),
  },
};

const mockPrisma = {
  inventoryItem: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  inventoryMovement: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  // ── listInventory ────────────────────────────────────────────────────────────

  describe('listInventory', () => {
    it('returns paginated inventory items with meta', async () => {
      const items = [makeItem()];
      mockPrisma.$transaction.mockResolvedValue([1, items]);

      const result = await service.listInventory({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        variantId: 'var-1',
        quantityOnHand: 20,
        quantityAvailable: 20,
        isLowStock: false,
      });
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('flags items at or below low-stock threshold', async () => {
      const items = [makeItem({ quantityOnHand: 3 })];
      mockPrisma.$transaction.mockResolvedValue([1, items]);

      const result = await service.listInventory({});

      expect(result.data[0].isLowStock).toBe(true);
    });

    it('calculates quantityAvailable as onHand minus reserved', async () => {
      const items = [makeItem({ quantityOnHand: 10, quantityReserved: 4 })];
      mockPrisma.$transaction.mockResolvedValue([1, items]);

      const result = await service.listInventory({});

      expect(result.data[0].quantityAvailable).toBe(6);
    });
  });

  // ── getByVariantId ───────────────────────────────────────────────────────────

  describe('getByVariantId', () => {
    it('returns shaped inventory item when found', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(makeItem());

      const result = await service.getByVariantId('var-1');

      expect(result.variantId).toBe('var-1');
      expect(result.quantityAvailable).toBe(20);
    });

    it('throws NotFoundException when inventory item does not exist', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(null);

      await expect(service.getByVariantId('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ── adjust ───────────────────────────────────────────────────────────────────

  describe('adjust', () => {
    it('increases stock and records a movement', async () => {
      const updatedItem = makeItem({ quantityOnHand: 30 });
      mockTx.inventoryItem.findUnique.mockResolvedValue(makeItem());
      mockTx.inventoryItem.update.mockResolvedValue(updatedItem);
      mockTx.inventoryMovement.create.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      const result = await service.adjust({
        variantId: 'var-1',
        delta: 10,
        reason: MovementReason.RESTOCK,
      });

      expect(result.quantityOnHand).toBe(30);
      expect(mockTx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            delta: 10,
            reason: MovementReason.RESTOCK,
          }),
        }),
      );
    });

    it('rejects an adjustment that would result in negative stock', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(makeItem({ quantityOnHand: 5 }));
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      await expect(
        service.adjust({ variantId: 'var-1', delta: -10, reason: MovementReason.ADMIN_ADJUSTMENT }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws NotFoundException when inventory item does not exist', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      await expect(
        service.adjust({ variantId: 'missing', delta: 5, reason: MovementReason.RESTOCK }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── ensureAvailable ──────────────────────────────────────────────────────────

  describe('ensureAvailable', () => {
    it('resolves when sufficient stock is available', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(
        makeItem({ quantityOnHand: 20, quantityReserved: 5 }),
      );

      await expect(service.ensureAvailable('var-1', 10)).resolves.toBeUndefined();
    });

    it('throws ConflictException when requested quantity exceeds available stock', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(
        makeItem({ quantityOnHand: 10, quantityReserved: 8 }),
      );

      await expect(service.ensureAvailable('var-1', 5)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when stock is zero', async () => {
      mockPrisma.inventoryItem.findUnique.mockResolvedValue(
        makeItem({ quantityOnHand: 0, quantityReserved: 0 }),
      );

      await expect(service.ensureAvailable('var-1', 1)).rejects.toThrow(ConflictException);
    });
  });

  // ── reserve ──────────────────────────────────────────────────────────────────

  describe('reserve', () => {
    it('increments quantityReserved and records SALE_RESERVED movement', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(
        makeItem({ quantityOnHand: 20, quantityReserved: 0 }),
      );
      mockTx.inventoryItem.update.mockResolvedValue({});
      mockTx.inventoryMovement.create.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      await service.reserve('var-1', 5, 'cart-abc');

      expect(mockTx.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantityReserved: 5 },
        }),
      );
      expect(mockTx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            delta: -5,
            reason: MovementReason.SALE_RESERVED,
            referenceId: 'cart-abc',
          }),
        }),
      );
    });

    it('throws ConflictException when reserving more than available', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(
        makeItem({ quantityOnHand: 3, quantityReserved: 0 }),
      );
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      await expect(service.reserve('var-1', 5, 'cart-abc')).rejects.toThrow(ConflictException);
    });
  });

  // ── release ──────────────────────────────────────────────────────────────────

  describe('release', () => {
    it('decrements quantityReserved and records RESERVATION_RELEASED movement', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(
        makeItem({ quantityOnHand: 20, quantityReserved: 10 }),
      );
      mockTx.inventoryItem.update.mockResolvedValue({});
      mockTx.inventoryMovement.create.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      await service.release('var-1', 5, 'cart-abc');

      expect(mockTx.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantityReserved: 5 },
        }),
      );
      expect(mockTx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            delta: 5,
            reason: MovementReason.RESERVATION_RELEASED,
          }),
        }),
      );
    });

    it('throws UnprocessableEntityException when releasing more than reserved', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(
        makeItem({ quantityOnHand: 20, quantityReserved: 2 }),
      );
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      await expect(service.release('var-1', 5, 'cart-abc')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ── deduct ───────────────────────────────────────────────────────────────────

  describe('deduct', () => {
    it('reduces quantityOnHand and quantityReserved and records SALE_DEDUCTED movement', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(
        makeItem({ quantityOnHand: 20, quantityReserved: 5 }),
      );
      mockTx.inventoryItem.update.mockResolvedValue({});
      mockTx.inventoryMovement.create.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      await service.deduct('var-1', 5, 'order-xyz');

      expect(mockTx.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantityOnHand: 15, quantityReserved: 0 },
        }),
      );
      expect(mockTx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            delta: -5,
            reason: MovementReason.SALE_DEDUCTED,
            referenceId: 'order-xyz',
          }),
        }),
      );
    });

    it('throws ConflictException when deducting more than on hand', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(
        makeItem({ quantityOnHand: 2, quantityReserved: 0 }),
      );
      mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

      await expect(service.deduct('var-1', 5, 'order-xyz')).rejects.toThrow(ConflictException);
    });
  });
});
