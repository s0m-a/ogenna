import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { GoogleOAuthService } from './google-oauth.service';

const CLIENT_ID = 'client-123.apps.googleusercontent.com';
const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);

function config(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function idToken(claims: Record<string, unknown>) {
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part(claims)}.sig`;
}

const validClaims = {
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  exp: NOW / 1000 + 300,
  sub: 'google-123',
  email: 'Shopper@Example.com',
  email_verified: true,
  name: 'Ada Shopper',
  picture: 'https://lh3.googleusercontent.com/a/pic',
};

describe('GoogleOAuthService', () => {
  const service = new GoogleOAuthService(
    config({
      GOOGLE_CLIENT_ID: CLIENT_ID,
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_CALLBACK_URL: 'http://localhost:5050/api/v1/auth/google/callback',
    }),
  );

  describe('createAuthRequest', () => {
    it('builds a PKCE authorization URL bound to a fresh state', () => {
      const first = service.createAuthRequest();
      const second = service.createAuthRequest();
      const url = new URL(first.url);

      expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url.searchParams.get('client_id')).toBe(CLIENT_ID);
      expect(url.searchParams.get('scope')).toBe('openid email profile');
      expect(url.searchParams.get('state')).toBe(first.state);
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('code_challenge')).toBe(
        crypto.createHash('sha256').update(first.codeVerifier).digest('base64url'),
      );
      expect(url.searchParams.has('client_secret')).toBe(false);
      expect(second.state).not.toBe(first.state);
    });

    it('reports not configured when credentials are missing', () => {
      const bare = new GoogleOAuthService(config({}));
      expect(bare.isConfigured()).toBe(false);
      expect(() => bare.createAuthRequest()).toThrow(ServiceUnavailableException);
    });
  });

  describe('parseIdToken', () => {
    it('returns the profile with a normalised email', () => {
      expect(service.parseIdToken(idToken(validClaims), CLIENT_ID, NOW)).toEqual({
        sub: 'google-123',
        email: 'shopper@example.com',
        emailVerified: true,
        name: 'Ada Shopper',
        picture: 'https://lh3.googleusercontent.com/a/pic',
      });
    });

    it.each([
      ['another app', { aud: 'someone-else' }],
      ['a foreign issuer', { iss: 'https://evil.example' }],
      ['an expired token', { exp: NOW / 1000 - 1 }],
      ['no email', { email: undefined }],
    ])('rejects a token for %s', (_label, override) => {
      expect(() =>
        service.parseIdToken(idToken({ ...validClaims, ...override }), CLIENT_ID, NOW),
      ).toThrow(UnauthorizedException);
    });

    it('rejects garbage', () => {
      expect(() => service.parseIdToken('not-a-jwt', CLIENT_ID, NOW)).toThrow(
        UnauthorizedException,
      );
    });

    it('treats a missing email_verified claim as unverified', () => {
      const { email_verified, ...rest } = validClaims;
      void email_verified;
      expect(service.parseIdToken(idToken(rest), CLIENT_ID, NOW).emailVerified).toBe(false);
    });
  });
});
