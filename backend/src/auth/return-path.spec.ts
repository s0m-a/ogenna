import { safeReturnPath } from './return-path';

describe('safeReturnPath', () => {
  it.each(['/checkout', '/account', '/shop/linen?colour=blue'])('keeps %s', (path) => {
    expect(safeReturnPath(path)).toBe(path);
  });

  it.each([
    undefined,
    '',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '/ok\r\nSet-Cookie: x=1',
    '/auth/callback',
    '/account/login',
    `/${'a'.repeat(600)}`,
  ])('falls back to /account for %p', (path) => {
    expect(safeReturnPath(path)).toBe('/account');
  });
});
