import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { BootstrapDto } from './dto/bootstrap.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { GoogleProfile } from './google-oauth.service';
import { Prisma, UserRole } from '@prisma/client';

/** Reasons a Google sign-in is refused; sent to the storefront as a code. */
export type OAuthFailureCode =
  | 'email_unverified'
  | 'staff_account'
  | 'account_disabled';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class OAuthSignInError extends Error {
  constructor(public readonly code: OAuthFailureCode) {
    super(code);
  }
}

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 32;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Password login is for staff; customers sign in with Google and have no password.
    if (!user || !user.isActive || !user.passwordHash || user.role === UserRole.CUSTOMER) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }


  async signInWithGoogle(profile: GoogleProfile, attempt = 0): Promise<TokenPair> {
    const linked = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider: 'GOOGLE', providerUserId: profile.sub } },
      include: { user: true },
    });

    let user = linked?.user;

    if (!user) {
      if (!profile.emailVerified) throw new OAuthSignInError('email_unverified');

      const existing = await this.prisma.user.findFirst({
        where: { email: { equals: profile.email, mode: 'insensitive' } },
      });

      if (existing && existing.role !== UserRole.CUSTOMER) {
        throw new OAuthSignInError('staff_account');
      }

      try {
        user = existing
          ? await this.prisma.user.update({
              where: { id: existing.id },
              data: {
                avatarUrl: existing.avatarUrl ?? profile.picture,
                oauthAccounts: {
                  create: { provider: 'GOOGLE', providerUserId: profile.sub, email: profile.email },
                },
              },
            })
          : await this.prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name?.trim() || profile.email.split('@')[0],
                avatarUrl: profile.picture,
                role: UserRole.CUSTOMER,
                oauthAccounts: {
                  create: { provider: 'GOOGLE', providerUserId: profile.sub, email: profile.email },
                },
              },
            });
      } catch (err) {
        // Two simultaneous first logins: the loser retries and finds the winner's rows.
        if (
          attempt === 0 &&
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          return this.signInWithGoogle(profile, 1);
        }
        throw err;
      }
    }

    if (!user.isActive) throw new OAuthSignInError('account_disabled');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Account is disabled.');
    }

    // Rotate: revoke current token and issue new pair
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async bootstrap(dto: BootstrapDto) {
    const existingCount = await this.prisma.user.count();
    if (existingCount > 0) {
      throw new ConflictException(
        'Bootstrap is only available when no users exist.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: 'OWNER',
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  private async issueTokens(userId: string, email: string, role: string): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email, role: role as JwtPayload['role'] };

    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = crypto
      .randomBytes(REFRESH_TOKEN_BYTES)
      .toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    const expiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');

    return { accessToken, refreshToken: rawRefreshToken, expiresIn };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
