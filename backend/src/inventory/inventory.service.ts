import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MovementReason } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';

const LOW_STOCK_THRESHOLD = 5;

const INVENTORY_INCLUDE = {
  variant: {
    select: {
      id: true,
      name: true,
      sku: true,
      product: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listInventory(query: InventoryQueryDto) {
    const { page = 1, limit = 20, search, lowStock } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (lowStock) {
      where.quantityOnHand = { lte: LOW_STOCK_THRESHOLD };
    }

    if (search) {
      where.variant = {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.inventoryItem.count({ where }),
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: INVENTORY_INCLUDE,
      }),
    ]);

    return {
      data: items.map(this.shape),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getByVariantId(variantId: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
      include: INVENTORY_INCLUDE,
    });

    if (!item) throw new NotFoundException(`Inventory not found for variant '${variantId}'.`);

    return this.shape(item);
  }

  async getMovements(variantId: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
      select: { id: true },
    });

    if (!item) throw new NotFoundException(`Inventory not found for variant '${variantId}'.`);

    return this.prisma.inventoryMovement.findMany({
      where: { inventoryItemId: item.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adjust(dto: AdjustInventoryDto) {
    const { variantId, delta, reason, note, referenceId } = dto;

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { variantId } });

      if (!item) throw new NotFoundException(`Inventory not found for variant '${variantId}'.`);

      const newQtyOnHand = item.quantityOnHand + delta;

      if (newQtyOnHand < 0) {
        throw new UnprocessableEntityException(
          `Adjustment would result in negative stock (current: ${item.quantityOnHand}, delta: ${delta}).`,
        );
      }

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantityOnHand: newQtyOnHand },
        include: INVENTORY_INCLUDE,
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: item.id,
          delta,
          reason,
          note,
          referenceId,
        },
      });

      return this.shape(updated);
    });
  }

  async ensureAvailable(variantId: string, quantity: number): Promise<void> {
    const item = await this.prisma.inventoryItem.findUnique({ where: { variantId } });

    if (!item) throw new NotFoundException(`Inventory not found for variant '${variantId}'.`);

    const available = item.quantityOnHand - item.quantityReserved;

    if (available < quantity) {
      throw new ConflictException(
        `Insufficient stock for variant '${variantId}': requested ${quantity}, available ${available}.`,
      );
    }
  }

  async reserve(variantId: string, quantity: number, referenceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { variantId } });

      if (!item) throw new NotFoundException(`Inventory not found for variant '${variantId}'.`);

      const available = item.quantityOnHand - item.quantityReserved;

      if (available < quantity) {
        throw new ConflictException(
          `Insufficient stock for variant '${variantId}': requested ${quantity}, available ${available}.`,
        );
      }

      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantityReserved: item.quantityReserved + quantity },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: item.id,
          delta: -quantity,
          reason: MovementReason.SALE_RESERVED,
          referenceId,
        },
      });
    });
  }

  async release(variantId: string, quantity: number, referenceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { variantId } });

      if (!item) throw new NotFoundException(`Inventory not found for variant '${variantId}'.`);

      const newReserved = item.quantityReserved - quantity;

      if (newReserved < 0) {
        throw new UnprocessableEntityException(
          `Cannot release ${quantity} units: only ${item.quantityReserved} reserved.`,
        );
      }

      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantityReserved: newReserved },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: item.id,
          delta: quantity,
          reason: MovementReason.RESERVATION_RELEASED,
          referenceId,
        },
      });
    });
  }

  async deduct(variantId: string, quantity: number, referenceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { variantId } });

      if (!item) throw new NotFoundException(`Inventory not found for variant '${variantId}'.`);

      const newQtyOnHand = item.quantityOnHand - quantity;
      const newReserved = Math.max(0, item.quantityReserved - quantity);

      if (newQtyOnHand < 0) {
        throw new ConflictException(
          `Insufficient stock to deduct ${quantity} for variant '${variantId}'.`,
        );
      }

      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantityOnHand: newQtyOnHand, quantityReserved: newReserved },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: item.id,
          delta: -quantity,
          reason: MovementReason.SALE_DEDUCTED,
          referenceId,
        },
      });
    });
  }

  async initializeForVariant(variantId: string) {
    return this.prisma.inventoryItem.upsert({
      where: { variantId },
      update: {},
      create: { variantId, quantityOnHand: 0, quantityReserved: 0 },
    });
  }

  private shape(item: any) {
    return {
      id: item.id,
      variantId: item.variantId,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      quantityAvailable: item.quantityOnHand - item.quantityReserved,
      isLowStock: item.quantityOnHand <= LOW_STOCK_THRESHOLD,
      updatedAt: item.updatedAt,
      variant: item.variant,
    };
  }
}
