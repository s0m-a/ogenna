const DEFAULT_RETURN_PATH = '/account';

/**
 * Only same-site relative paths may be used as a post-login destination,
 * otherwise the sign-in flow becomes an open redirect.
 */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) {
    return DEFAULT_RETURN_PATH;
  }
  // "/path" is fine; "//evil.com", "/\evil.com" and anything absolute are not.
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return DEFAULT_RETURN_PATH;
  }
  if (/[\u0000-\u001f]/.test(value)) return DEFAULT_RETURN_PATH;
  // Never bounce a customer back into the auth pages themselves.
  if (value.startsWith('/auth/') || value.startsWith('/account/login')) {
    return DEFAULT_RETURN_PATH;
  }
  return value;
}
