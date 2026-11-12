import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

const mockJwtService = { verify: jest.fn() } as unknown as JwtService;

const makeContext = (authHeader: string | undefined) => ({
  switchToHttp: () => ({
    getRequest: () => ({
      headers: authHeader !== undefined ? { authorization: authHeader } : {},
    }),
  }),
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard(mockJwtService);
    jest.clearAllMocks();
  });

  it('attaches payload to request when token is valid', () => {
    const payload = { sub: 'user-1', email: 'a@b.com', role: 'ADMIN' };
    (mockJwtService.verify as jest.Mock).mockReturnValue(payload);
    const request: any = { headers: { authorization: 'Bearer valid-token' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;

    expect(guard.canActivate(ctx)).toBe(true);
    expect(request.user).toEqual(payload);
  });

  it('throws UnauthorizedException when Authorization header is missing', () => {
    const ctx = makeContext(undefined) as any;
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when scheme is not Bearer', () => {
    const ctx = makeContext('Basic some-token') as any;
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when token is expired or invalid', () => {
    (mockJwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const ctx = makeContext('Bearer bad-token') as any;
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
