import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@prisma/client';

const makeContext = (role: UserRole) => ({
  switchToHttp: () => ({
    getRequest: () => ({ user: { sub: '1', email: 'a@b.com', role } }),
  }),
  getHandler: () => ({}),
  getClass: () => ({}),
});

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);
    expect(guard.canActivate(makeContext(UserRole.CONTENT_EDITOR) as any)).toBe(true);
  });

  it('always allows OWNER regardless of required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(makeContext(UserRole.OWNER) as any)).toBe(true);
  });

  it('allows user whose role is in the required list', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN, UserRole.CONTENT_EDITOR]);
    expect(guard.canActivate(makeContext(UserRole.CONTENT_EDITOR) as any)).toBe(true);
  });

  it('denies user whose role is not in the required list', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(makeContext(UserRole.INVENTORY_MANAGER) as any)).toBe(false);
  });

  it('method-level @Roles overrides class-level via getAllAndOverride', () => {
    // If handler specifies OWNER only, an ADMIN should be denied
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.OWNER]);
    expect(guard.canActivate(makeContext(UserRole.ADMIN) as any)).toBe(false);
  });
});
