import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  collection: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('CollectionsService', () => {
  let service: CollectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns active collections', async () => {
      const collections = [{ id: '1', name: 'New Arrivals', slug: 'new-arrivals', _count: { products: 3 } }];
      mockPrisma.collection.findMany.mockResolvedValue(collections);

      const result = await service.findAll();

      expect(result).toEqual(collections);
      expect(mockPrisma.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { archivedAt: null } }),
      );
    });
  });

  describe('findBySlug', () => {
    it('returns collection with active products', async () => {
      const collection = { id: '1', name: 'Sale', slug: 'sale', products: [] };
      mockPrisma.collection.findFirst.mockResolvedValue(collection);

      const result = await service.findBySlug('sale');

      expect(result).toEqual(collection);
    });

    it('throws NotFoundException for unknown slug', async () => {
      mockPrisma.collection.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
