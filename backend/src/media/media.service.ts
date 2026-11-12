import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, MediaResourceType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto';
import { UpdateMediaAssetDto } from './dto/update-media-asset.dto';
import { MediaQueryDto } from './dto/media-query.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  signUpload(folder?: string) {
    return this.cloudinary.signUpload(folder);
  }

  async create(dto: CreateMediaAssetDto, userId?: string) {
    try {
      return await this.prisma.mediaAsset.create({
        data: {
          publicId: dto.publicId,
          url: dto.url,
          secureUrl: dto.secureUrl,
          resourceType: dto.resourceType ?? MediaResourceType.IMAGE,
          format: dto.format,
          width: dto.width,
          height: dto.height,
          bytes: dto.bytes,
          folder: dto.folder,
          alt: dto.alt,
          tags: dto.tags ?? [],
          originalName: dto.originalName,
          createdById: userId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A media asset with this publicId already exists.');
      }
      throw err;
    }
  }

  async findAll(query: MediaQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 24;
    const where: Prisma.MediaAssetWhereInput = {
      archivedAt: null,
      ...(query.resourceType && { resourceType: query.resourceType }),
      ...(query.folder && { folder: query.folder }),
      ...(query.tag && { tags: { has: query.tag } }),
      ...(query.search && {
        OR: [
          { alt: { contains: query.search, mode: 'insensitive' } },
          { originalName: { contains: query.search, mode: 'insensitive' } },
          { publicId: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.archivedAt) {
      throw new NotFoundException('Media asset not found.');
    }
    return asset;
  }

  async update(id: string, dto: UpdateMediaAssetDto) {
    await this.findOne(id);
    return this.prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(dto.alt !== undefined && { alt: dto.alt }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
    });
  }

  async findUsages(id: string) {
    const asset = await this.findOne(id);
    const productImages = await this.prisma.productImage.findMany({
      where: { mediaAssetId: asset.id },
      select: {
        id: true,
        productId: true,
        variantId: true,
        product: { select: { id: true, name: true, slug: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
    });
    return { assetId: asset.id, productImages };
  }

  async remove(id: string) {
    const asset = await this.findOne(id);
    const referencedCount = await this.prisma.productImage.count({
      where: { mediaAssetId: id },
    });
    if (referencedCount > 0) {
      throw new BadRequestException(
        `Cannot delete: media asset is used by ${referencedCount} product image(s). Remove references first.`,
      );
    }

    const resourceType =
      asset.resourceType === MediaResourceType.VIDEO
        ? 'video'
        : asset.resourceType === MediaResourceType.RAW
          ? 'raw'
          : 'image';
    await this.cloudinary.destroy(asset.publicId, resourceType);

    return this.prisma.mediaAsset.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }
}
