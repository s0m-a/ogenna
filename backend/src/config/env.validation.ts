import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  ADMIN_API_KEY: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  CLOUDINARY_UPLOAD_FOLDER: Joi.string().default('ogenna'),
  // Paystack secret key (use sk_test_… outside production). Server-side only.
  PAYSTACK_SECRET_KEY: Joi.string().required(),
  // Storefront page Paystack redirects the customer to after payment.
  PAYSTACK_CALLBACK_URL: Joi.string()
    .uri()
    .default('http://localhost:3000/checkout/callback'),
  // Unpaid orders (including those waiting for a bank transfer) expire after this long.
  ORDER_PAYMENT_EXPIRY_MINUTES: Joi.number().integer().min(1).default(1440),
  // How often the expiry sweep runs.
  ORDER_EXPIRY_SWEEP_SECONDS: Joi.number().integer().min(5).default(60),
  // Global request budget per client IP per minute (stricter per-route limits
  // live in src/common/throttle/rate-limits.ts).
  RATE_LIMIT_PER_MINUTE: Joi.number().integer().min(1).default(120),
  RATE_LIMIT_DISABLED: Joi.boolean().default(false),
  // Set when running behind a proxy/load balancer (e.g. 1 = trust one hop) so
  // rate limits key on the real client IP, not the proxy's.
  TRUST_PROXY: Joi.string().default('false'),
  // Storefront origin — where OAuth sign-in returns the customer.
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  // Google OAuth client (Web application). Optional: without them the
  // "Continue with Google" endpoint answers 503 and the rest of the API runs.
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  // Must exactly match an "Authorized redirect URI" on the Google client.
  GOOGLE_CALLBACK_URL: Joi.string()
    .uri()
    .default('http://localhost:5050/api/v1/auth/google/callback'),
});
