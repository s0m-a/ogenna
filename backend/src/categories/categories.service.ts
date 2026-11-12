import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { archivedAt: null },
      orderBy: { name: 'asc' },
      include: { children: { where: { archivedAt: null }, orderBy: { name: 'asc' } } },
    });
  }

  async findAllAdmin() {
    return this.prisma.category.findMany({
      where: { archivedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
        children: { where: { archivedAt: null }, orderBy: { name: 'asc' } },
        parent: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, archivedAt: null },
      include: {
        children: { where: { archivedAt: null }, orderBy: { name: 'asc' } },
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category '${slug}' not found.`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.archivedAt) {
        throw new NotFoundException(`Parent category not found.`);
      }
    }

    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || category.archivedAt) {
      throw new NotFoundException(`Category not found.`);
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent.');
      }
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.archivedAt) {
        throw new NotFoundException(`Parent category not found.`);
      }
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async archive(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category || category.archivedAt) {
      throw new NotFoundException(`Category not found.`);
    }

    return this.prisma.category.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }
}
