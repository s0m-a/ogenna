import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const VALID_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export interface GoogleProfile {
  /** Google's stable account id — the only safe key for linking. */
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

export interface GoogleAuthRequest {
  url: string;
  state: string;
  codeVerifier: string;
}

/**
 * Google OpenID Connect, authorization-code flow with PKCE.
 * The client secret never leaves the server; the browser only ever sees the
 * Google consent page and our own callback redirect.
 */
@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('GOOGLE_CLIENT_ID') &&
        this.config.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  createAuthRequest(): GoogleAuthRequest {
    const { clientId, callbackUrl } = this.credentials();
    const state = randomToken();
    const codeVerifier = randomToken();
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });

    return { url: `${AUTHORIZE_URL}?${params.toString()}`, state, codeVerifier };
  }

  /** Exchanges the authorization code and returns the verified identity claims. */
  async exchangeCode(code: string, codeVerifier: string): Promise<GoogleProfile> {
    const { clientId, clientSecret, callbackUrl } = this.credentials();

    let response: Response;
    try {
      response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }),
      });
    } catch (err) {
      this.logger.error(`Google token request failed: ${(err as Error).message}`);
      throw new BadGatewayException('Could not reach Google.');
    }

    const body = (await response.json().catch(() => ({}))) as {
      id_token?: string;
      error?: string;
    };

    if (!response.ok || !body.id_token) {
      // invalid_grant = code reused/expired; anything else is a config problem.
      this.logger.warn(`Google token exchange rejected: ${body.error ?? response.status}`);
      throw new UnauthorizedException('Google sign-in could not be completed.');
    }

    return this.parseIdToken(body.id_token, clientId);
  }

  /**
   * The ID token came straight from Google's token endpoint over TLS, so per
   * OpenID Connect Core §3.1.3.7 its signature check may be skipped; the
   * audience, issuer and expiry are still validated.
   */
  parseIdToken(idToken: string, clientId: string, now = Date.now()): GoogleProfile {
    const [, payloadPart] = idToken.split('.');
    let claims: Record<string, unknown>;
    try {
      claims = JSON.parse(Buffer.from(payloadPart ?? '', 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Google returned an unreadable identity.');
    }

    const aud = claims.aud;
    const audOk = Array.isArray(aud) ? aud.includes(clientId) : aud === clientId;
    if (!audOk || !VALID_ISSUERS.includes(String(claims.iss))) {
      throw new UnauthorizedException('Google identity was not issued for this app.');
    }
    if (typeof claims.exp !== 'number' || claims.exp * 1000 < now) {
      throw new UnauthorizedException('Google identity has expired.');
    }
    if (typeof claims.sub !== 'string' || typeof claims.email !== 'string') {
      throw new UnauthorizedException('Google did not share an email address.');
    }

    return {
      sub: claims.sub,
      email: claims.email.toLowerCase(),
      emailVerified: claims.email_verified === true || claims.email_verified === 'true',
      name: typeof claims.name === 'string' ? claims.name : null,
      picture: typeof claims.picture === 'string' ? claims.picture : null,
    };
  }

  private credentials() {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.config.get<string>('GOOGLE_CALLBACK_URL');
    if (!clientId || !clientSecret || !callbackUrl) {
      throw new ServiceUnavailableException('Google sign-in is not configured.');
    }
    return { clientId, clientSecret, callbackUrl };
  }
}

function randomToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
