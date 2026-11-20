import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { AuthService, OAuthSignInError } from './auth.service';
import { GoogleOAuthService } from './google-oauth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { BootstrapDto } from './dto/bootstrap.dto';
import { safeReturnPath } from './return-path';
import { RateLimit } from '../common/throttle/rate-limits';

const OAUTH_COOKIE = 'ogenna_google_oauth';
const OAUTH_COOKIE_PATH = '/api/v1/auth/google';
const OAUTH_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

interface OAuthCookie {
  state: string;
  verifier: string;
  returnTo: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly google: GoogleOAuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('bootstrap')
  @RateLimit.bootstrap()
  bootstrap(@Body() dto: BootstrapDto) {
    return this.authService.bootstrap(dto);
  }

  @Post('login')
  @RateLimit.login()
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @RateLimit.session()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @RateLimit.session()
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }


  @Get('google')
  @RateLimit.oauth()
  startGoogle(@Query('returnTo') returnTo: string | undefined, @Res() res: Response) {
    const target = safeReturnPath(returnTo);

    if (!this.google.isConfigured()) {
      return this.redirectToStorefront(res, { error: 'not_configured', returnTo: target });
    }

    const { url, state, codeVerifier } = this.google.createAuthRequest();
    const cookie: OAuthCookie = { state, verifier: codeVerifier, returnTo: target };

    res.cookie(OAUTH_COOKIE, Buffer.from(JSON.stringify(cookie)).toString('base64url'), {
      httpOnly: true,
      // Lax still sends the cookie on Google's top-level redirect back to us.
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      path: OAUTH_COOKIE_PATH,
      maxAge: OAUTH_COOKIE_MAX_AGE_MS,
    });
    return res.redirect(url);
  }

  /** Google redirects here with ?code&state (or ?error when the user cancels). */
  @Get('google/callback')
  @RateLimit.oauth()
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const stored = readOAuthCookie(req.headers.cookie);
    res.clearCookie(OAUTH_COOKIE, { path: OAUTH_COOKIE_PATH });
    const returnTo = stored?.returnTo ?? '/account';

    if (error) {
      return this.redirectToStorefront(res, {
        error: error === 'access_denied' ? 'cancelled' : 'google_error',
        returnTo,
      });
    }

    // CSRF / login-fixation guard: the state must match the one we issued to this browser.
    if (!stored || !code || !state || !timingSafeEqualStr(stored.state, state)) {
      return this.redirectToStorefront(res, { error: 'invalid_state', returnTo });
    }

    try {
      const profile = await this.google.exchangeCode(code, stored.verifier);
      const tokens = await this.authService.signInWithGoogle(profile);
      // A fragment never reaches servers or logs. The storefront immediately
      // trades this refresh token at /auth/refresh, which rotates (revokes) it.
      return this.redirectToStorefront(res, { token: tokens.refreshToken, returnTo });
    } catch (err) {
      if (err instanceof OAuthSignInError) {
        return this.redirectToStorefront(res, { error: err.code, returnTo });
      }
      this.logger.error(`Google sign-in failed: ${(err as Error).message}`);
      return this.redirectToStorefront(res, { error: 'google_error', returnTo });
    }
  }

  private redirectToStorefront(res: Response, params: Record<string, string>) {
    const base = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000').replace(/\/$/, '');
    return res.redirect(`${base}/auth/callback#${new URLSearchParams(params).toString()}`);
  }
}

function readOAuthCookie(header: string | undefined): OAuthCookie | null {
  const raw = header
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OAUTH_COOKIE}=`))
    ?.slice(OAUTH_COOKIE.length + 1);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as OAuthCookie;
    if (typeof parsed.state !== 'string' || typeof parsed.verifier !== 'string') return null;
    return { ...parsed, returnTo: safeReturnPath(parsed.returnTo) };
  } catch {
    return null;
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
