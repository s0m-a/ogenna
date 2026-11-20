import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';
import { ProductSearchService } from './product-search.service';
import { SortBy, SortOrder } from './dto/product-query.dto';

const mockPrisma = {
  product: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockSearch = { matchIds: jest.fn() };

const makeProduct = (overrides = {}) => ({
  id: 'prod-1',
  name: 'Demo Cotton Poplin',
  slug: 'demo-cotton-poplin',
  status: ProductStatus.PUBLISHED,
  archivedAt: null,
  variants: [],
  images: [],
  categories: [],
  collections: [],
  ...overrides,
});

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProductSearchService, useValue: mockSearch },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated products with meta', async () => {
      const products = [makeProduct()];
      mockPrisma.$transaction.mockResolvedValue([1, products]);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        sortBy: SortBy.CREATED_AT,
        sortOrder: SortOrder.DESC,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ id: 'prod-1', name: 'Demo Cotton Poplin', variantCount: 0, totalStock: 0 });
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('filters by PUBLISHED status by default', async () => {
      mockPrisma.$transaction.mockResolvedValue([0, []]);

      const result = await service.findAll({});

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('calculates totalPages correctly', async () => {
      mockPrisma.$transaction.mockResolvedValue([45, []]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('search', () => {
    it('orders search results by relevance when no sort is chosen', async () => {
      mockSearch.matchIds.mockResolvedValue(['b', 'a', 'c']);
      // 'c' is excluded by another filter (e.g. category).
      mockPrisma.product.findMany
        .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }])
        .mockResolvedValueOnce([makeProduct({ id: 'a' }), makeProduct({ id: 'b' })]);

      const result = await service.findAll({ page: 1, limit: 20, search: 'cotton' });

      expect(mockSearch.matchIds).toHaveBeenCalledWith('cotton', { status: ProductStatus.PUBLISHED });
      expect(result.data.map((p) => p.id)).toEqual(['b', 'a']);
      expect(result.meta).toMatchObject({ total: 2, totalPages: 1 });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('keeps an explicit sort and restricts to the matched ids', async () => {
      mockSearch.matchIds.mockResolvedValue(['b', 'a']);
      mockPrisma.$transaction.mockResolvedValue([0, []]);

      await service.findAll({ page: 1, limit: 20, search: 'cotton', sortBy: SortBy.NAME, sortOrder: SortOrder.ASC });

      const [, findManyArgs] = mockPrisma.product.findMany.mock.calls.at(-1) ? [null, mockPrisma.product.findMany.mock.calls.at(-1)![0]] : [];
      expect(findManyArgs.where.id).toEqual({ in: ['b', 'a'] });
      expect(findManyArgs.orderBy).toEqual({ name: SortOrder.ASC });
    });

    it('searchPublished returns published matches in ranked order', async () => {
      mockSearch.matchIds.mockResolvedValue(['b', 'a']);
      mockPrisma.product.findMany.mockResolvedValue([makeProduct({ id: 'a' }), makeProduct({ id: 'b' })]);

      const result = await service.searchPublished('linen', 5);

      expect(mockSearch.matchIds).toHaveBeenCalledWith('linen', { status: ProductStatus.PUBLISHED, limit: 5 });
      expect(result.data.map((p) => p.id)).toEqual(['b', 'a']);
    });

    it('searchPublished skips the product query when nothing matches', async () => {
      mockSearch.matchIds.mockResolvedValue([]);
      const result = await service.searchPublished('zzz');
      expect(result.data).toEqual([]);
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findBySlug', () => {
    it('returns product when found', async () => {
      const product = makeProduct();
      mockPrisma.product.findFirst.mockResolvedValue(product);

      const result = await service.findBySlug('demo-cotton-poplin');

      expect(result).toEqual(product);
    });

    it('throws NotFoundException for unknown slug', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('sets first variant as default when none specified', async () => {
      const product = makeProduct();
      mockPrisma.product.create.mockResolvedValue(product);

      const dto = {
        name: 'Test Fabric',
        slug: 'test-fabric',
        variants: [
          { name: 'White', priceAmount: 800 },
          { name: 'Blue', priceAmount: 800 },
        ],
      };

      await service.create(dto);

      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            variants: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ name: 'White', isDefault: true }),
              ]),
            }),
          }),
        }),
      );
    });

    it('throws BadRequestException when multiple variants marked as default', async () => {
      const dto = {
        name: 'Bad Product',
        slug: 'bad-product',
        variants: [
          { name: 'A', priceAmount: 100, isDefault: true },
          { name: 'B', priceAmount: 100, isDefault: true },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('archive', () => {
    it('sets status to ARCHIVED and records archivedAt', async () => {
      const product = makeProduct();
      mockPrisma.product.findFirst.mockResolvedValue(product);
      mockPrisma.product.update.mockResolvedValue({
        ...product,
        status: ProductStatus.ARCHIVED,
        archivedAt: new Date(),
      });

      const result = await service.archive('prod-1');

      expect(result.status).toBe(ProductStatus.ARCHIVED);
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ProductStatus.ARCHIVED,
          }),
        }),
      );
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.archive('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
