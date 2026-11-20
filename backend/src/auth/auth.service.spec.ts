import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { OAuthSignInError } from './auth.service';

const mockPrisma = {
  oAuthAccount: {
    findUnique: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwtService = { sign: jest.fn().mockReturnValue('access-token') };
const mockConfig = { get: jest.fn((key: string, def?: string) => def ?? 'test-value') };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('access-token');
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 1);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: hash,
        role: 'ADMIN',
        isActive: true,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'a@b.com', password: 'password123' });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe('string');
    });

    it('throws UnauthorizedException for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct', 1);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: hash,
        role: 'ADMIN',
        isActive: true,
      });

      await expect(service.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for inactive account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'x',
        role: 'ADMIN',
        isActive: false,
      });

      await expect(service.login({ email: 'a@b.com', password: 'any' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException when token is not found', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('unknown-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token is revoked', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 10000),
        user: { id: 'u1', email: 'a@b.com', role: 'ADMIN', isActive: true },
      });

      await expect(service.refresh('some-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token is expired', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: { id: 'u1', email: 'a@b.com', role: 'ADMIN', isActive: true },
      });

      await expect(service.refresh('some-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates token and returns new pair on valid refresh', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'u1', email: 'a@b.com', role: 'ADMIN', isActive: true },
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('valid-token');

      expect(result.accessToken).toBe('access-token');
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ revokedAt: expect.any(Date) }) }),
      );
    });
  });

  describe('bootstrap', () => {
    it('throws ConflictException when users already exist', async () => {
      mockPrisma.user.count.mockResolvedValue(1);

      await expect(
        service.bootstrap({ name: 'Owner', email: 'o@b.com', password: 'password123456' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates first OWNER and returns tokens when no users exist', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'o@b.com',
        role: 'OWNER',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.bootstrap({
        name: 'Owner',
        email: 'o@b.com',
        password: 'password123456',
      });

      expect(result.accessToken).toBe('access-token');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'OWNER' }),
        }),
      );
    });
  });

  describe('login (staff only)', () => {
    it('rejects customers, who have no password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'c1',
        email: 'shopper@example.com',
        passwordHash: null,
        role: 'CUSTOMER',
        isActive: true,
      });

      await expect(
        service.login({ email: 'shopper@example.com', password: 'anything' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  describe('signInWithGoogle', () => {
    const profile = {
      sub: 'google-123',
      email: 'shopper@example.com',
      emailVerified: true,
      name: 'Ada Shopper',
      picture: 'https://lh3.googleusercontent.com/a/pic',
    };

    beforeEach(() => {
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
    });

    it('signs in a returning customer by their Google id', async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue({
        user: { id: 'c1', email: profile.email, role: 'CUSTOMER', isActive: true },
      });

      const result = await service.signInWithGoogle(profile);

      expect(result.refreshToken).toHaveLength(64);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'c1', role: 'CUSTOMER' }),
      );
    });

    it('creates a CUSTOMER (never staff) account on first sign-in', async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'c2',
        email: profile.email,
        role: 'CUSTOMER',
        isActive: true,
      });

      await service.signInWithGoogle(profile);

      const data = mockPrisma.user.create.mock.calls[0][0].data;
      expect(data.role).toBe('CUSTOMER');
      expect(data.passwordHash).toBeUndefined();
      expect(data.oauthAccounts.create).toEqual(
        expect.objectContaining({ provider: 'GOOGLE', providerUserId: 'google-123' }),
      );
    });

    it('links Google to an existing customer with the same verified email', async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'c3',
        email: profile.email,
        role: 'CUSTOMER',
        isActive: true,
        avatarUrl: null,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'c3',
        email: profile.email,
        role: 'CUSTOMER',
        isActive: true,
      });

      await service.signInWithGoogle(profile);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update.mock.calls[0][0].data.oauthAccounts.create).toEqual(
        expect.objectContaining({ providerUserId: 'google-123' }),
      );
    });

    it('refuses to link a Google login to a staff account', async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'owner',
        email: profile.email,
        role: 'OWNER',
        isActive: true,
      });

      await expect(service.signInWithGoogle(profile)).rejects.toEqual(
        new OAuthSignInError('staff_account'),
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('refuses an unverified Google email for a new account', async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.signInWithGoogle({ ...profile, emailVerified: false }),
      ).rejects.toEqual(new OAuthSignInError('email_unverified'));
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('refuses a disabled customer', async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue({
        user: { id: 'c1', email: profile.email, role: 'CUSTOMER', isActive: false },
      });

      await expect(service.signInWithGoogle(profile)).rejects.toEqual(
        new OAuthSignInError('account_disabled'),
      );
      expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('recovers when two first sign-ins race on the unique email', async () => {
      const conflict = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      });
      mockPrisma.oAuthAccount.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          user: { id: 'c4', email: profile.email, role: 'CUSTOMER', isActive: true },
        });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockRejectedValue(conflict);

      const result = await service.signInWithGoogle(profile);

      expect(result.accessToken).toBe('access-token');
      expect(mockPrisma.oAuthAccount.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
