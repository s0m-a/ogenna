import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns active categories with children', async () => {
      const categories = [{ id: '1', name: 'Cotton', slug: 'cotton', children: [] }];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toEqual(categories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { archivedAt: null } }),
      );
    });
  });

  describe('findBySlug', () => {
    it('returns category when found', async () => {
      const category = { id: '1', name: 'Cotton', slug: 'cotton', children: [], parent: null };
      mockPrisma.category.findFirst.mockResolvedValue(category);

      const result = await service.findBySlug('cotton');

      expect(result).toEqual(category);
    });

    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a top-level category', async () => {
      const dto = { name: 'Silk', slug: 'silk' };
      const created = { id: '2', ...dto, parentId: null };
      mockPrisma.category.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({ data: dto });
    });

    it('throws NotFoundException when parentId does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Sub', slug: 'sub', parentId: 'missing-id' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a subcategory when parent exists', async () => {
      const parent = { id: 'parent-1', archivedAt: null };
      mockPrisma.category.findUnique.mockResolvedValue(parent);
      const dto = { name: 'Shirting', slug: 'shirting', parentId: 'parent-1' };
      const created = { id: '3', ...dto };
      mockPrisma.category.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
    });
  });
});
