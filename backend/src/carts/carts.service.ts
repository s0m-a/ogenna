import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { STORE_CURRENCY } from '../common/constants/currency';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      variant: {
        include: {
          // Variant-level image (when the variant has its own photo).
          images: { orderBy: { position: 'asc' as const }, take: 1 },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sellingUnit: true,
              minOrderQty: true,
              qtyIncrement: true,
              status: true,
              // Product-level image used as a fallback when the variant
              // has no dedicated image (the common case for our catalogue).
              images: { orderBy: { position: 'asc' as const }, take: 1 },
            },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class CartsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async getOrCreateForUser(userId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });

    if (existing) return this.shape(existing);

    const created = await this.prisma.cart.create({
      data: { userId, status: CartStatus.ACTIVE },
      include: CART_INCLUDE,
    });

    return this.shape(created);
  }

  async getOrCreateForGuest(guestToken: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { guestToken },
      include: CART_INCLUDE,
    });

    if (existing) return this.shape(existing);

    const created = await this.prisma.cart.create({
      data: { guestToken, status: CartStatus.ACTIVE },
      include: CART_INCLUDE,
    });

    return this.shape(created);
  }

  async getForUser(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });

    if (!cart) throw new NotFoundException('No active cart found.');

    return this.shape(cart);
  }

  async getForGuest(guestToken: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { guestToken },
      include: CART_INCLUDE,
    });

    if (!cart) throw new NotFoundException('No active cart found for this token.');

    return this.shape(cart);
  }

  async addItem(cartId: string, dto: AddCartItemDto) {
    const { variantId, quantity } = dto;

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          select: {
            id: true,
            status: true,
            minOrderQty: true,
            qtyIncrement: true,
            sellingUnit: true,
          },
        },
      },
    });

    if (!variant || !variant.isActive) {
      throw new NotFoundException(`Variant '${variantId}' not found or unavailable.`);
    }

    if (variant.product.status !== 'PUBLISHED') {
      throw new BadRequestException('This product is not available for purchase.');
    }

    this.validateQuantityRules(quantity, variant.product.minOrderQty, variant.product.qtyIncrement);

    await this.inventoryService.ensureAvailable(variantId, quantity);

    const unitPriceAmount = variant.salePriceAmount ?? variant.priceAmount;

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      this.validateQuantityRules(newQty, variant.product.minOrderQty, variant.product.qtyIncrement);
      await this.inventoryService.ensureAvailable(variantId, newQty);

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty, unitPriceAmount },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId, variantId, quantity, unitPriceAmount, currencyCode: variant.currencyCode },
      });
    }

    await this.prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });

    return this.fetchCart(cartId);
  }

  async updateItem(cartId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        variant: {
          include: { product: { select: { minOrderQty: true, qtyIncrement: true } } },
        },
      },
    });

    if (!item || item.cartId !== cartId) {
      throw new NotFoundException('Cart item not found.');
    }

    this.validateQuantityRules(
      dto.quantity,
      item.variant.product.minOrderQty,
      item.variant.product.qtyIncrement,
    );

    await this.inventoryService.ensureAvailable(item.variantId, dto.quantity);

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    await this.prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });

    return this.fetchCart(cartId);
  }

  async removeItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({ where: { id: itemId } });

    if (!item || item.cartId !== cartId) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    await this.prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });

    return this.fetchCart(cartId);
  }

  async mergeGuestIntoUser(guestToken: string, userId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { guestToken },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { minOrderQty: true, qtyIncrement: true, status: true } } },
            },
          },
        },
      },
    });

    if (!guestCart || guestCart.status !== CartStatus.ACTIVE) {
      return this.getOrCreateForUser(userId);
    }

    const userCart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!userCart) {
      // Claim the guest cart
      const claimed = await this.prisma.cart.update({
        where: { id: guestCart.id },
        data: { userId, guestToken: null },
        include: CART_INCLUDE,
      });
      return this.shape(claimed);
    }

    // Merge guest items into existing user cart
    for (const guestItem of guestCart.items) {
      if (guestItem.variant.product.status !== 'PUBLISHED' || !guestItem.variant.isActive) {
        continue;
      }

      const existing = userCart.items.find((i) => i.variantId === guestItem.variantId);
      const mergedQty = (existing?.quantity ?? 0) + guestItem.quantity;

      try {
        await this.inventoryService.ensureAvailable(guestItem.variantId, mergedQty);
      } catch {
        // Skip items that exceed stock rather than blocking the merge
        continue;
      }

      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: mergedQty },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId: guestItem.variantId,
            quantity: guestItem.quantity,
            unitPriceAmount: guestItem.unitPriceAmount,
            currencyCode: guestItem.currencyCode,
          },
        });
      }
    }

    await this.prisma.cart.update({
      where: { id: guestCart.id },
      data: { status: CartStatus.MERGED },
    });

    return this.fetchCart(userCart.id);
  }

  resolveCartId(cart: { id: string }) {
    return cart.id;
  }

  async assertOwnership(cartId: string, userId?: string | null, guestToken?: string | null) {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });

    if (!cart) throw new NotFoundException('Cart not found.');

    const ownedByUser = userId && cart.userId === userId;
    const ownedByGuest = guestToken && cart.guestToken === guestToken;

    if (!ownedByUser && !ownedByGuest) {
      throw new ForbiddenException('You do not have access to this cart.');
    }

    return cart;
  }

  private validateQuantityRules(quantity: number, minOrderQty: number, qtyIncrement: number) {
    if (quantity < minOrderQty) {
      throw new BadRequestException(
        `Minimum order quantity is ${minOrderQty}.`,
      );
    }

    if ((quantity - minOrderQty) % qtyIncrement !== 0) {
      throw new BadRequestException(
        `Quantity must be in increments of ${qtyIncrement} above the minimum of ${minOrderQty}.`,
      );
    }
  }

  private async fetchCart(cartId: string) {
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: CART_INCLUDE,
    });
    return this.shape(cart);
  }

  private shape(cart: any) {
    const items = (cart.items as any[]).map((item) => {
      const lineTotalAmount = item.unitPriceAmount * item.quantity;
      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceAmount: item.unitPriceAmount,
        lineTotalAmount,
        currencyCode: item.currencyCode,
        variant: {
          id: item.variant.id,
          name: item.variant.name,
          sku: item.variant.sku,
          attributes: item.variant.attributes,
          coverImage:
            item.variant.images?.[0] ?? item.variant.product.images?.[0] ?? null,
          product: item.variant.product,
        },
      };
    });

    const subtotalAmount = items.reduce((sum, i) => sum + i.lineTotalAmount, 0);
    const currencyCode = items[0]?.currencyCode ?? STORE_CURRENCY;

    return {
      id: cart.id,
      guestToken: cart.guestToken,
      status: cart.status,
      items,
      itemCount: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
      subtotalAmount,
      currencyCode,
      updatedAt: cart.updatedAt,
    };
  }
}
