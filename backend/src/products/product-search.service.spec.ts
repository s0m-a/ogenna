import { Test, TestingModule } from '@nestjs/testing';
import { ProductStatus } from '@prisma/client';
import { ProductSearchService } from './product-search.service';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  $queryRaw: jest.fn(),
  // Batch transactions resolve each queued query in order.
  $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
  searchQuery: { create: jest.fn() },
};

describe('ProductSearchService', () => {
  let service: ProductSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductSearchService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ProductSearchService);
    jest.clearAllMocks();
  });

  describe('normalize', () => {
    it('trims, lower-cases and collapses whitespace', () => {
      expect(service.normalize('  Cotton   MUSLIN \n')).toBe('cotton muslin');
    });
  });

  describe('toPrefixQuery', () => {
    it('turns each word into a prefix term', () => {
      expect(service.toPrefixQuery('cotton musl')).toBe('cotton:* & musl:*');
    });

    it('strips tsquery syntax from user input', () => {
      expect(service.toPrefixQuery("lin&en | !x:* (')")).toBe('linen:* & x:*');
    });

    it('keeps accented letters and digits', () => {
      expect(service.toPrefixQuery('crêpe 100')).toBe('crêpe:* & 100:*');
    });

    it('returns null when nothing searchable is left', () => {
      expect(service.toPrefixQuery('!! ??')).toBeNull();
    });
  });

  describe('matchIds', () => {
    it('does not query for terms shorter than 2 characters', async () => {
      expect(await service.matchIds(' a ')).toEqual([]);
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('returns ids in the order the database ranked them', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ set_config: '0.5' }])
        .mockResolvedValueOnce([{ id: 'b' }, { id: 'a' }]);
      expect(await service.matchIds('linen')).toEqual(['b', 'a']);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('record', () => {
    it('stores the normalised term with a server-side result count', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ set_config: '0.5' }])
        .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
      await service.record('  Linen ');
      expect(mockPrisma.searchQuery.create).toHaveBeenCalledWith({
        data: { term: 'linen', resultCount: 2 },
      });
    });

    it('skips terms that are too short', async () => {
      await service.record('x');
      expect(mockPrisma.searchQuery.create).not.toHaveBeenCalled();
    });

    it('swallows database errors so searching keeps working', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('db down'));
      await expect(service.record('linen')).resolves.toBeUndefined();
    });
  });

  it('searches only published products when recording', async () => {
    const spy = jest.spyOn(service, 'matchIds').mockResolvedValue([]);
    await service.record('linen');
    expect(spy).toHaveBeenCalledWith('linen', { status: ProductStatus.PUBLISHED });
  });
});
