import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from '../../auth/auth.controller';
import { AuthService } from '../../auth/auth.service';
import { GoogleOAuthService } from '../../auth/google-oauth.service';
import { RateLimitModule } from './rate-limit.module';
import { RATE_LIMIT_MESSAGE } from './rate-limits';

/** Drives the real AuthController through the real global throttler guard. */
async function bootApp(env: Record<string, unknown> = {}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => env] }),
      RateLimitModule,
    ],
    controllers: [AuthController],
    providers: [
      {
        provide: AuthService,
        useValue: {
          login: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r', expiresIn: '15m' }),
          refresh: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r', expiresIn: '15m' }),
        },
      },
      { provide: GoogleOAuthService, useValue: { isConfigured: () => false } },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

const login = (app: INestApplication) =>
  request(app.getHttpServer()).post('/auth/login').send({ email: 'a@b.com', password: 'x' });

describe('Rate limiting', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('allows 5 login attempts a minute, then answers 429 with Retry-After', async () => {
    app = await bootApp();

    for (let i = 0; i < 5; i++) {
      await login(app).expect(200);
    }
    const blocked = await login(app).expect(429);

    expect(blocked.body.message).toBe(RATE_LIMIT_MESSAGE);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('keeps separate budgets per route', async () => {
    app = await bootApp();

    for (let i = 0; i < 6; i++) await login(app);
    // Login is locked out, but token refresh has its own (larger) budget.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'x' })
      .expect(200);
  });

  it('can be switched off with RATE_LIMIT_DISABLED', async () => {
    app = await bootApp({ RATE_LIMIT_DISABLED: true });

    for (let i = 0; i < 8; i++) {
      await login(app).expect(200);
    }
  });
});
