import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Address, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

export const MAX_ADDRESSES = 10;

type Tx = Prisma.TransactionClient;

/**
 * A customer's address book. Every query is scoped by the caller's userId, so
 * an address id belonging to someone else behaves exactly like a missing one.
 */
@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  /**
   * Saving the same address twice (e.g. ticking "save" at every checkout)
   * returns the existing entry instead of creating a duplicate.
   */
  async create(userId: string, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findMany({ where: { userId } });

      const duplicate = existing.find((a) => sameAddress(a, dto));
      if (duplicate) {
        if (dto.isDefault && !duplicate.isDefault) {
          return this.makeDefault(tx, userId, duplicate.id);
        }
        return duplicate;
      }

      if (existing.length >= MAX_ADDRESSES) {
        throw new BadRequestException(
          `You can save up to ${MAX_ADDRESSES} addresses. Remove one to add another.`,
        );
      }

      // The first address becomes the default automatically.
      const isDefault = dto.isDefault === true || existing.length === 0;
      if (isDefault) await this.clearDefault(tx, userId);

      return tx.address.create({
        data: {
          ...fields(dto),
          recipientName: dto.recipientName,
          phone: dto.phone,
          addressLine1: dto.addressLine1,
          city: dto.city,
          state: dto.state,
          country: dto.country ?? 'NG',
          isDefault,
          userId,
        },
      });
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.findOwned(tx, userId, id);
      if (dto.isDefault === true && !current.isDefault) await this.clearDefault(tx, userId);

      return tx.address.update({
        where: { id: current.id },
        data: {
          ...fields(dto),
          ...(dto.country !== undefined && { country: dto.country }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });
    });
  }

  async setDefault(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.findOwned(tx, userId, id);
      return this.makeDefault(tx, userId, id);
    });
  }

  async remove(userId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      const current = await this.findOwned(tx, userId, id);
      await tx.address.delete({ where: { id: current.id } });

      // Keep a default whenever the customer still has addresses.
      if (current.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
  }

  private async findOwned(tx: Tx, userId: string, id: string): Promise<Address> {
    const address = await tx.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found.');
    return address;
  }

  private clearDefault(tx: Tx, userId: string) {
    return tx.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  private async makeDefault(tx: Tx, userId: string, id: string) {
    await this.clearDefault(tx, userId);
    return tx.address.update({ where: { id }, data: { isDefault: true } });
  }
}

/** Only the address fields; `undefined` leaves a field untouched on update. */
function fields(dto: UpdateAddressDto) {
  return {
    label: emptyToNull(dto.label),
    recipientName: dto.recipientName,
    phone: dto.phone,
    addressLine1: dto.addressLine1,
    addressLine2: emptyToNull(dto.addressLine2),
    city: dto.city,
    state: dto.state,
    postalCode: emptyToNull(dto.postalCode),
  };
}

function emptyToNull(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value.trim() === '' ? null : value;
}

const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

function sameAddress(a: Address, dto: CreateAddressDto): boolean {
  return (
    norm(a.recipientName) === norm(dto.recipientName) &&
    norm(a.phone).replace(/[^0-9+]/g, '') === norm(dto.phone).replace(/[^0-9+]/g, '') &&
    norm(a.addressLine1) === norm(dto.addressLine1) &&
    norm(a.addressLine2) === norm(dto.addressLine2) &&
    norm(a.city) === norm(dto.city) &&
    norm(a.state) === norm(dto.state) &&
    norm(a.postalCode) === norm(dto.postalCode) &&
    a.country === (dto.country ?? 'NG')
  );
}
