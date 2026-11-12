import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminApiKeyGuard } from './admin-api-key.guard';

const makeContext = (headerValue: string | undefined) => ({
  switchToHttp: () => ({
    getRequest: () => ({
      headers: headerValue !== undefined ? { 'x-admin-key': headerValue } : {},
    }),
  }),
});

describe('AdminApiKeyGuard', () => {
  const configService = { get: jest.fn().mockReturnValue('test-key') } as unknown as ConfigService;
  const guard = new AdminApiKeyGuard(configService);

  it('allows requests with correct key', () => {
    const ctx = makeContext('test-key') as any;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects requests with wrong key', () => {
    const ctx = makeContext('wrong-key') as any;
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('rejects requests with no key header', () => {
    const ctx = makeContext(undefined) as any;
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
