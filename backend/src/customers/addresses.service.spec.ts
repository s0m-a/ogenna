import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddressesService, MAX_ADDRESSES } from './addresses.service';
import { PrismaService } from '../database/prisma.service';

const tx = {
  address: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
};

const prisma = {
  address: { findMany: jest.fn() },
  $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
} as unknown as PrismaService;

const input = {
  recipientName: 'Ada Shopper',
  phone: '+234 801 234 5678',
  addressLine1: '12 Admiralty Way',
  city: 'Lekki',
  state: 'Lagos',
};

function saved(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    userId: 'u1',
    label: null,
    addressLine2: null,
    postalCode: null,
    country: 'NG',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
    ...overrides,
  };
}

describe('AddressesService', () => {
  const service = new AddressesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    tx.address.create.mockImplementation(({ data }) => ({ id: 'new', ...data }));
    tx.address.update.mockImplementation(({ where, data }) => ({ id: where.id, ...data }));
  });

  describe('create', () => {
    it('makes the first address the default', async () => {
      tx.address.findMany.mockResolvedValue([]);

      const result = await service.create('u1', input);

      expect(result).toEqual(expect.objectContaining({ isDefault: true, userId: 'u1', country: 'NG' }));
      expect(tx.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isDefault: true },
        data: { isDefault: false },
      });
    });

    it('does not make later addresses default unless asked', async () => {
      tx.address.findMany.mockResolvedValue([saved({ id: 'old', addressLine1: '1 Other St', isDefault: true })]);

      const result = await service.create('u1', input);

      expect(result.isDefault).toBe(false);
      expect(tx.address.updateMany).not.toHaveBeenCalled();
    });

    it('moves the default when a new address asks for it', async () => {
      tx.address.findMany.mockResolvedValue([saved({ id: 'old', addressLine1: '1 Other St', isDefault: true })]);

      const result = await service.create('u1', { ...input, isDefault: true });

      expect(tx.address.updateMany).toHaveBeenCalled();
      expect(result.isDefault).toBe(true);
    });

    it('returns the existing entry instead of saving a duplicate', async () => {
      const existing = saved({ addressLine1: '12  admiralty way', phone: '+2348012345678' });
      tx.address.findMany.mockResolvedValue([existing]);

      const result = await service.create('u1', input);

      expect(result).toBe(existing);
      expect(tx.address.create).not.toHaveBeenCalled();
    });

    it(`refuses more than ${MAX_ADDRESSES} addresses`, async () => {
      tx.address.findMany.mockResolvedValue(
        Array.from({ length: MAX_ADDRESSES }, (_, i) => saved({ id: `a${i}`, addressLine1: `${i} Road` })),
      );

      await expect(service.create('u1', input)).rejects.toThrow(BadRequestException);
      expect(tx.address.create).not.toHaveBeenCalled();
    });
  });

  describe('ownership', () => {
    it.each([
      ['update', () => service.update('u2', 'a1', { city: 'Ikeja' })],
      ['setDefault', () => service.setDefault('u2', 'a1')],
      ['remove', () => service.remove('u2', 'a1')],
    ])("%s treats another customer's address as not found", async (_name, call) => {
      tx.address.findFirst.mockResolvedValue(null);

      await expect(call()).rejects.toThrow(NotFoundException);
      expect(tx.address.findFirst).toHaveBeenCalledWith({ where: { id: 'a1', userId: 'u2' } });
      expect(tx.address.update).not.toHaveBeenCalled();
      expect(tx.address.delete).not.toHaveBeenCalled();
    });
  });

  describe('setDefault', () => {
    it('clears the previous default first', async () => {
      tx.address.findFirst.mockResolvedValue(saved());

      const result = await service.setDefault('u1', 'a1');

      expect(tx.address.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
        tx.address.update.mock.invocationCallOrder[0],
      );
      expect(result.isDefault).toBe(true);
    });
  });

  describe('remove', () => {
    it('promotes the most recent address when the default is deleted', async () => {
      tx.address.findFirst
        .mockResolvedValueOnce(saved({ isDefault: true }))
        .mockResolvedValueOnce(saved({ id: 'a2' }));

      await service.remove('u1', 'a1');

      expect(tx.address.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
      expect(tx.address.update).toHaveBeenCalledWith({ where: { id: 'a2' }, data: { isDefault: true } });
    });

    it('leaves the default alone when deleting another address', async () => {
      tx.address.findFirst.mockResolvedValueOnce(saved({ isDefault: false }));

      await service.remove('u1', 'a1');

      expect(tx.address.update).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('clears an optional field when sent as an empty string', async () => {
      tx.address.findFirst.mockResolvedValue(saved({ addressLine2: 'Flat 3' }));

      await service.update('u1', 'a1', { addressLine2: '' });

      expect(tx.address.update.mock.calls[0][0].data.addressLine2).toBeNull();
      expect(tx.address.update.mock.calls[0][0].data.city).toBeUndefined();
    });
  });
});
