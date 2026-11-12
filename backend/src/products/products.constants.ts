import { Prisma } from '@prisma/client';

export const PRODUCT_LIST_INCLUDE = {
  // Take 2 images so the storefront card can swap to a secondary shot on hover.
  images: { orderBy: { position: 'asc' as const }, take: 2 },
  variants: {
    where: { isActive: true },
    orderBy: { isDefault: 'desc' as const },
    select: {
      id: true,
      name: true,
      sku: true,
      priceAmount: true,
      salePriceAmount: true,
      currencyCode: true,
      isDefault: true,
      attributes: true,
      inventory: { select: { quantityOnHand: true, quantityReserved: true } },
    },
  },
  categories: {
    include: { category: { select: { id: true, name: true, slug: true } } },
  },
} satisfies Prisma.ProductInclude;

export const PRODUCT_DETAIL_INCLUDE = {
  images: { orderBy: { position: 'asc' as const } },
  variants: {
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' as const }, { name: 'asc' as const }],
    include: {
      images: { orderBy: { position: 'asc' as const } },
      inventory: { select: { quantityOnHand: true, quantityReserved: true } },
    },
  },
  categories: {
    include: { category: { select: { id: true, name: true, slug: true } } },
  },
  collections: {
    include: {
      collection: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.ProductInclude;
