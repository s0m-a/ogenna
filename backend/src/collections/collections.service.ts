import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.collection.findMany({
      where: { archivedAt: null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findAllAdmin() {
    return this.prisma.collection.findMany({
      where: { archivedAt: null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findBySlug(slug: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { slug, archivedAt: null },
      include: {
        products: {
          where: { product: { status: 'PUBLISHED', archivedAt: null } },
          orderBy: { position: 'asc' },
          include: {
            product: {
              include: {
                images: { orderBy: { position: 'asc' }, take: 1 },
                variants: { where: { isActive: true }, orderBy: { isDefault: 'desc' } },
              },
            },
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection '${slug}' not found.`);
    }

    return collection;
  }

  async create(dto: CreateCollectionDto) {
    return this.prisma.collection.create({ data: dto });
  }

  async update(id: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.archivedAt) {
      throw new NotFoundException(`Collection not found.`);
    }
    return this.prisma.collection.update({ where: { id }, data: dto });
  }

  async archive(id: string) {
    const collection = await this.prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.archivedAt) {
      throw new NotFoundException(`Collection not found.`);
    }
    return this.prisma.collection.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }
}
