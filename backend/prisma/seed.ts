/**
 * Demonstration seed — clearly artificial data, not real product listings.
 * Run: npx ts-node prisma/seed.ts
 */

import { PrismaClient, ProductStatus, SellingUnit } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demonstration data...');

  // ── Categories ──────────────────────────────────────────────────────────────

  const cottonCat = await prisma.category.upsert({
    where: { slug: 'cotton' },
    update: {},
    create: { name: 'Cotton', slug: 'cotton' },
  });

  const linenCat = await prisma.category.upsert({
    where: { slug: 'linen' },
    update: {},
    create: { name: 'Linen', slug: 'linen' },
  });

  const wovenCat = await prisma.category.upsert({
    where: { slug: 'woven' },
    update: {},
    create: { name: 'Woven', slug: 'woven' },
  });

  // ── Collections ─────────────────────────────────────────────────────────────

  const newArrivals = await prisma.collection.upsert({
    where: { slug: 'new-arrivals' },
    update: {},
    create: {
      name: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'The latest additions to our fabric range.',
    },
  });

  const saleCollection = await prisma.collection.upsert({
    where: { slug: 'sale' },
    update: {},
    create: {
      name: 'Sale',
      slug: 'sale',
      description: 'Selected fabrics at reduced prices.',
    },
  });

  const featuredCollection = await prisma.collection.upsert({
    where: { slug: 'featured' },
    update: {},
    create: {
      name: 'Featured',
      slug: 'featured',
      description: 'Staff picks and customer favourites.',
    },
  });

  // ── Products ─────────────────────────────────────────────────────────────────

  // Product 1 — plain cotton poplin
  const poplin = await prisma.product.upsert({
    where: { slug: 'demo-cotton-poplin' },
    update: {},
    create: {
      name: 'Demo Cotton Poplin',
      slug: 'demo-cotton-poplin',
      description:
        'A lightweight, tightly woven cotton poplin suitable for shirts, dresses, and children\'s wear. — DEMONSTRATION PRODUCT',
      fabricType: 'Poplin',
      materialComposition: '100% Cotton',
      widthCm: 150,
      weightGsm: 90,
      careInstructions: 'Machine wash 40°C. Iron on medium.',
      status: ProductStatus.PUBLISHED,
      sellingUnit: SellingUnit.METER,
      minOrderQty: 1,
      qtyIncrement: 1,
      isFeatured: true,
      variants: {
        create: [
          {
            name: 'White',
            sku: 'DEMO-POPLIN-WHITE',
            attributes: { colour: 'White' },
            priceAmount: 895,
            currencyCode: 'GBP',
            isDefault: true,
          },
          {
            name: 'Sky Blue',
            sku: 'DEMO-POPLIN-SKY',
            attributes: { colour: 'Sky Blue' },
            priceAmount: 895,
            currencyCode: 'GBP',
          },
          {
            name: 'Navy',
            sku: 'DEMO-POPLIN-NAVY',
            attributes: { colour: 'Navy' },
            priceAmount: 895,
            currencyCode: 'GBP',
          },
        ],
      },
      categories: { create: [{ categoryId: cottonCat.id }, { categoryId: wovenCat.id }] },
    },
  });

  // Product 2 — stonewashed linen
  const linen = await prisma.product.upsert({
    where: { slug: 'demo-stonewashed-linen' },
    update: {},
    create: {
      name: 'Demo Stonewashed Linen',
      slug: 'demo-stonewashed-linen',
      description:
        'A soft, pre-washed linen with a relaxed drape. Ideal for summer garments and home furnishings. — DEMONSTRATION PRODUCT',
      fabricType: 'Linen',
      materialComposition: '100% Linen',
      widthCm: 140,
      weightGsm: 175,
      careInstructions: 'Machine wash 30°C. Tumble dry low.',
      status: ProductStatus.PUBLISHED,
      sellingUnit: SellingUnit.METER,
      minOrderQty: 1,
      qtyIncrement: 1,
      isFeatured: true,
      variants: {
        create: [
          {
            name: 'Natural',
            sku: 'DEMO-LINEN-NAT',
            attributes: { colour: 'Natural' },
            priceAmount: 1450,
            currencyCode: 'GBP',
            isDefault: true,
          },
          {
            name: 'Sage Green',
            sku: 'DEMO-LINEN-SAGE',
            attributes: { colour: 'Sage Green' },
            priceAmount: 1450,
            currencyCode: 'GBP',
          },
          {
            name: 'Dusty Rose',
            sku: 'DEMO-LINEN-ROSE',
            attributes: { colour: 'Dusty Rose' },
            priceAmount: 1450,
            salePriceAmount: 1100,
            currencyCode: 'GBP',
          },
        ],
      },
      categories: { create: [{ categoryId: linenCat.id }] },
    },
  });

  // Product 3 — cotton canvas (sale item)
  const canvas = await prisma.product.upsert({
    where: { slug: 'demo-cotton-canvas' },
    update: {},
    create: {
      name: 'Demo Cotton Canvas',
      slug: 'demo-cotton-canvas',
      description:
        'A sturdy, medium-weight cotton canvas for bags, upholstery, and outerwear. — DEMONSTRATION PRODUCT',
      fabricType: 'Canvas',
      materialComposition: '100% Cotton',
      widthCm: 150,
      weightGsm: 280,
      careInstructions: 'Spot clean or machine wash 30°C cold.',
      status: ProductStatus.PUBLISHED,
      sellingUnit: SellingUnit.METER,
      minOrderQty: 1,
      qtyIncrement: 1,
      variants: {
        create: [
          {
            name: 'Ecru',
            sku: 'DEMO-CANVAS-ECRU',
            attributes: { colour: 'Ecru' },
            priceAmount: 1200,
            salePriceAmount: 900,
            currencyCode: 'GBP',
            isDefault: true,
          },
          {
            name: 'Charcoal',
            sku: 'DEMO-CANVAS-CHAR',
            attributes: { colour: 'Charcoal' },
            priceAmount: 1200,
            salePriceAmount: 900,
            currencyCode: 'GBP',
          },
        ],
      },
      categories: { create: [{ categoryId: cottonCat.id }, { categoryId: wovenCat.id }] },
    },
  });

  // ── Collection membership ────────────────────────────────────────────────────

  await prisma.collectionProduct.createMany({
    skipDuplicates: true,
    data: [
      { collectionId: newArrivals.id, productId: poplin.id, position: 1 },
      { collectionId: newArrivals.id, productId: linen.id, position: 2 },
      { collectionId: saleCollection.id, productId: canvas.id, position: 1 },
      { collectionId: saleCollection.id, productId: linen.id, position: 2 },
      { collectionId: featuredCollection.id, productId: poplin.id, position: 1 },
      { collectionId: featuredCollection.id, productId: linen.id, position: 2 },
    ],
  });

  // ── Inventory ────────────────────────────────────────────────────────────────
  // Seed specific stock quantities for demo variants. Uses upsert so re-running
  // is safe and won't overwrite quantities that were manually adjusted.

  const demoVariants = await prisma.productVariant.findMany({
    where: { product: { slug: { in: ['demo-cotton-poplin', 'demo-stonewashed-linen', 'demo-cotton-canvas'] } } },
    select: { id: true, sku: true },
  });

  const stockBySku: Record<string, number> = {
    'DEMO-POPLIN-WHITE': 50,
    'DEMO-POPLIN-SKY': 30,
    'DEMO-POPLIN-NAVY': 20,
    'DEMO-LINEN-NAT': 40,
    'DEMO-LINEN-SAGE': 25,
    'DEMO-LINEN-ROSE': 3,   // intentionally low to demonstrate low-stock flag
    'DEMO-CANVAS-ECRU': 15,
    'DEMO-CANVAS-CHAR': 12,
  };

  for (const variant of demoVariants) {
    const qty = variant.sku ? (stockBySku[variant.sku] ?? 0) : 0;
    await prisma.inventoryItem.upsert({
      where: { variantId: variant.id },
      update: { quantityOnHand: qty },
      create: { variantId: variant.id, quantityOnHand: qty, quantityReserved: 0 },
    });
  }

  // Backfill: create an InventoryItem (qty 0) for any variant that doesn't have
  // one yet. This handles variants created before the product service was updated
  // to auto-create inventory, and makes the seed fully idempotent.
  const variantsWithoutInventory = await prisma.productVariant.findMany({
    where: { inventory: { is: null } },
    select: { id: true },
  });

  for (const v of variantsWithoutInventory) {
    await prisma.inventoryItem.create({
      data: { variantId: v.id, quantityOnHand: 0, quantityReserved: 0 },
    });
  }

  console.log('Seed complete.');
  console.log(`  Categories: cotton, linen, woven`);
  console.log(`  Collections: new-arrivals, sale, featured`);
  console.log(`  Products: demo-cotton-poplin, demo-stonewashed-linen, demo-cotton-canvas`);
  console.log(`  Inventory: seeded for ${demoVariants.length} demo variants`);
  console.log(`  Inventory: backfilled ${variantsWithoutInventory.length} variants with no inventory record`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
