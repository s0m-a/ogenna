import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminProductQueryDto, ProductQueryDto, SortBy } from './dto/product-query.dto';
import { PRODUCT_LIST_INCLUDE, PRODUCT_DETAIL_INCLUDE } from './products.constants';
import { ProductSearchService } from './product-search.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productSearch: ProductSearchService,
  ) {}

  /** Instant search results: published products only, best match first. */
  async searchPublished(q: string, limit: number = 8) {
    const ids = await this.productSearch.matchIds(q, {
      status: ProductStatus.PUBLISHED,
      limit,
    });
    return { data: await this.findListItemsInOrder(ids) };
  }

  /** Loads list items for `ids`, keeping the order of `ids`. */
  private async findListItemsInOrder(ids: string[]) {
    if (!ids.length) return [];
    const items = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: PRODUCT_LIST_INCLUDE,
    });
    const position = new Map(ids.map((id, i) => [id, i]));
    return items
      .sort((a, b) => position.get(a.id)! - position.get(b.id)!)
      .map((p) => this.shapeListItem(p));
  }

  async findAll(query: ProductQueryDto) {
    return this.buildProductList(query, ProductStatus.PUBLISHED);
  }

  async findAllAdmin(query: AdminProductQueryDto) {
    // Admin sees all non-archived statuses unless a specific status is requested
    return this.buildProductList(query, query.status);
  }

  private async buildProductList(
    query: ProductQueryDto,
    status?: ProductStatus,
  ) {
    const {
      page = 1,
      limit = 20,
      search,
      categorySlug,
      collectionSlug,
      isFeatured,
      onSale,
      sortBy,
      sortOrder = 'desc',
      minPrice,
      maxPrice,
    } = query;

    const where: Prisma.ProductWhereInput = {
      archivedAt: null,
      ...(status ? { status } : {}),
    };

    // Ranked ids from Postgres search; the other filters still apply on top.
    let rankedIds: string[] | null = null;
    if (search) {
      rankedIds = await this.productSearch.matchIds(search, { status });
      where.id = { in: rankedIds };
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (categorySlug) {
      where.categories = {
        some: { category: { slug: categorySlug } },
      };
    }

    if (collectionSlug) {
      where.collections = {
        some: { collection: { slug: collectionSlug } },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          isActive: true,
          priceAmount: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        },
      };
    }

    if (onSale) {
      where.variants = {
        some: { isActive: true, salePriceAmount: { not: null } },
      };
    }

    if (rankedIds && (!sortBy || sortBy === SortBy.RELEVANCE)) {
      return this.buildRelevancePage(where, rankedIds, page, limit);
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput;

    if (sortBy === SortBy.NAME) {
      orderBy = { name: sortOrder };
    } else if (sortBy === SortBy.PRICE) {
      // Prisma aggregate orderBy on relations requires a cast here
      orderBy = { variants: { _min: { priceAmount: sortOrder } } } as Prisma.ProductOrderByWithRelationInput;
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const skip = (page - 1) * limit;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: PRODUCT_LIST_INCLUDE,
      }),
    ]);

    return {
      data: items.map((p) => this.shapeListItem(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Paginates search results in relevance order, which Prisma can't express
   * as an orderBy. Fine at catalogue scale: matches are capped at 500 ids.
   */
  private async buildRelevancePage(
    where: Prisma.ProductWhereInput,
    rankedIds: string[],
    page: number,
    limit: number,
  ) {
    const matching = await this.prisma.product.findMany({ where, select: { id: true } });
    const keep = new Set(matching.map((p) => p.id));
    const ordered = rankedIds.filter((id) => keep.has(id));
    const skip = (page - 1) * limit;

    return {
      data: await this.findListItemsInOrder(ordered.slice(skip, skip + limit)),
      meta: {
        total: ordered.length,
        page,
        limit,
        totalPages: Math.ceil(ordered.length / limit),
      },
    };
  }

  private shapeListItem(p: any) {
    const variants = p.variants as any[];
    // PRODUCT_LIST_INCLUDE orders variants by `isDefault desc`, so [0] is the
    // default variant — the one a quick-add from a product card should buy.
    const defaultVariantId = variants[0]?.id ?? null;
    const prices = variants.map((v: any) => v.priceAmount as number);
    // Effective selling price per variant — sale price when set, otherwise list.
    const salePrices = variants
      .map((v: any) => (v.salePriceAmount ?? null) as number | null)
      .filter((n): n is number => n !== null);
    const totalStock = variants.reduce(
      (sum: number, v: any) =>
        sum + (v.inventory ? (v.inventory.quantityOnHand - v.inventory.quantityReserved) : 0),
      0,
    );
    const imageList = p.images as any[];
    const coverImage = imageList[0] ?? null;
    const hoverImage = imageList[1] ?? null;
    const primaryCategory = (p.categories as any[])[0]?.category ?? null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      fabricType: p.fabricType,
      updatedAt: p.updatedAt,
      category: primaryCategory,
      coverImage: coverImage ? { id: coverImage.id, url: coverImage.url, altText: coverImage.altText } : null,
      hoverImage: hoverImage ? { id: hoverImage.id, url: hoverImage.url, altText: hoverImage.altText } : null,
      variantCount: variants.length,
      defaultVariantId,
      priceMin: prices.length ? Math.min(...prices) / 100 : undefined,
      priceMax: prices.length ? Math.max(...prices) / 100 : undefined,
      salePriceMin: salePrices.length ? Math.min(...salePrices) / 100 : undefined,
      salePriceMax: salePrices.length ? Math.max(...salePrices) / 100 : undefined,
      totalStock,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, archivedAt: null },
      include: PRODUCT_DETAIL_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException(`Product '${slug}' not found.`);
    }

    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, archivedAt: null },
      include: PRODUCT_DETAIL_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException(`Product not found.`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const { categoryIds, variants, images, ...productData } = dto;

    if (variants && variants.length > 0) {
      const defaultCount = variants.filter((v) => v.isDefault).length;
      if (defaultCount > 1) {
        throw new BadRequestException('Only one variant can be marked as default.');
      }
      if (defaultCount === 0) {
        variants[0].isDefault = true;
      }
    }

    const productImageIds = (images ?? []).map((i) => i.mediaAssetId);
    const variantImageIds = (variants ?? []).flatMap(
      (v) => v.images?.map((i) => i.mediaAssetId) ?? [],
    );
    const assetUrls = await this.resolveMediaUrls([
      ...productImageIds,
      ...variantImageIds,
    ]);

    const productId = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          categories: categoryIds
            ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
            : undefined,
        },
      });

      if (variants && variants.length > 0) {
        for (const v of variants) {
          const createdVariant = await tx.productVariant.create({
            data: {
              productId: product.id,
              name: v.name,
              sku: v.sku,
              attributes: (v.attributes ?? {}) as Prisma.InputJsonValue,
              priceAmount: v.priceAmount,
              salePriceAmount: v.salePriceAmount,
              currencyCode: v.currencyCode,
              isDefault: v.isDefault ?? false,
              inventory: { create: { quantityOnHand: 0, quantityReserved: 0 } },
            },
          });

          if (v.images && v.images.length > 0) {
            await tx.productImage.createMany({
              data: v.images.map((img, idx) => ({
                productId: product.id,
                variantId: createdVariant.id,
                mediaAssetId: img.mediaAssetId,
                url: assetUrls.get(img.mediaAssetId) ?? '',
                altText: img.altText,
                position: img.position ?? idx,
              })),
            });
          }
        }
      }

      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img, idx) => ({
            productId: product.id,
            mediaAssetId: img.mediaAssetId,
            url: assetUrls.get(img.mediaAssetId) ?? '',
            altText: img.altText,
            position: img.position ?? idx,
          })),
        });
      }

      return product.id;
    });

    return this.findById(productId);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);

    const { categoryIds, variants, images, ...productData } = dto;

    const productImageIds = (images ?? []).map((i) => i.mediaAssetId);
    const variantImageIds = (variants ?? []).flatMap(
      (v) => v.images?.map((i) => i.mediaAssetId) ?? [],
    );
    const assetUrls = await this.resolveMediaUrls([
      ...productImageIds,
      ...variantImageIds,
    ]);

    if (variants !== undefined) {
      const defaultCount = variants.filter((v) => v.isDefault).length;
      if (defaultCount > 1) {
        throw new BadRequestException('Only one variant can be marked as default.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: productData });

      if (categoryIds !== undefined) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        if (categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({ productId: id, categoryId })),
          });
        }
      }

      if (images !== undefined) {
        await tx.productImage.deleteMany({
          where: { productId: id, variantId: null },
        });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img, idx) => ({
              productId: id,
              mediaAssetId: img.mediaAssetId,
              url: assetUrls.get(img.mediaAssetId) ?? '',
              altText: img.altText,
              position: img.position ?? idx,
            })),
          });
        }
      }

      if (variants !== undefined) {
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: id },
          select: { id: true, isActive: true },
        });
        const existingIds = new Set(existingVariants.map((v) => v.id));
        const payloadIds = new Set(
          variants.filter((v) => v.id).map((v) => v.id as string),
        );

        const toSoftDelete = [...existingIds].filter((vid) => !payloadIds.has(vid));
        if (toSoftDelete.length > 0) {
          await tx.productVariant.updateMany({
            where: { id: { in: toSoftDelete } },
            data: { isActive: false, isDefault: false },
          });
        }

        for (const v of variants) {
          const variantData = {
            name: v.name,
            sku: v.sku,
            priceAmount: v.priceAmount,
            salePriceAmount: v.salePriceAmount ?? null,
            currencyCode: v.currencyCode,
            isDefault: v.isDefault ?? false,
            attributes: (v.attributes ?? {}) as Prisma.InputJsonValue,
          };

          let variantId: string;
          if (v.id && existingIds.has(v.id)) {
            variantId = v.id;
            await tx.productVariant.update({
              where: { id: v.id },
              data: { ...variantData, isActive: true },
            });
          } else {
            const created = await tx.productVariant.create({
              data: {
                productId: id,
                ...variantData,
                inventory: { create: { quantityOnHand: 0, quantityReserved: 0 } },
              },
            });
            variantId = created.id;
          }

          if (v.images !== undefined) {
            await tx.productImage.deleteMany({ where: { variantId } });
            if (v.images.length > 0) {
              await tx.productImage.createMany({
                data: v.images.map((img, idx) => ({
                  productId: id,
                  variantId,
                  mediaAssetId: img.mediaAssetId,
                  url: assetUrls.get(img.mediaAssetId) ?? '',
                  altText: img.altText,
                  position: img.position ?? idx,
                })),
              });
            }
          }
        }

        const active = await tx.productVariant.findMany({
          where: { productId: id, isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true, isDefault: true },
        });
        const activeDefaults = active.filter((v) => v.isDefault);
        if (active.length > 0 && activeDefaults.length === 0) {
          await tx.productVariant.update({
            where: { id: active[0].id },
            data: { isDefault: true },
          });
        }
      }
    });

    return this.findById(id);
  }

  private async resolveMediaUrls(ids: string[]): Promise<Map<string, string>> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return new Map();
    const assets = await this.prisma.mediaAsset.findMany({
      where: { id: { in: unique }, archivedAt: null },
      select: { id: true, secureUrl: true },
    });
    if (assets.length !== unique.length) {
      throw new BadRequestException('One or more media assets were not found.');
    }
    return new Map(assets.map((a) => [a.id, a.secureUrl]));
  }

  async publish(id: string) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.PUBLISHED },
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }

  async unpublish(id: string) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.DRAFT },
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }

  async duplicate(id: string) {
    const product = await this.findById(id);

    const baseName = `${product.name} (Copy)`;
    const baseSlug = `${product.slug}-copy`;
    const uniqueSuffix = Date.now().toString(36);

    return this.prisma.product.create({
      data: {
        name: baseName,
        slug: `${baseSlug}-${uniqueSuffix}`,
        description: product.description,
        fabricType: product.fabricType,
        materialComposition: product.materialComposition,
        widthCm: product.widthCm,
        weightGsm: product.weightGsm,
        careInstructions: product.careInstructions,
        status: ProductStatus.DRAFT,
        sellingUnit: product.sellingUnit,
        minOrderQty: product.minOrderQty,
        qtyIncrement: product.qtyIncrement,
        variants: {
          create: product.variants.map((v) => ({
            name: v.name,
            sku: v.sku ? `${v.sku}-copy-${uniqueSuffix}` : undefined,
            attributes: v.attributes as Prisma.InputJsonValue,
            priceAmount: v.priceAmount,
            salePriceAmount: v.salePriceAmount,
            currencyCode: v.currencyCode,
            isDefault: v.isDefault,
            inventory: { create: { quantityOnHand: 0, quantityReserved: 0 } },
          })),
        },
        categories: {
          create: product.categories.map((c) => ({ categoryId: c.categoryId })),
        },
      },
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }

  async archive(id: string) {
    await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.ARCHIVED,
        archivedAt: new Date(),
      },
      include: PRODUCT_DETAIL_INCLUDE,
    });
  }
}
