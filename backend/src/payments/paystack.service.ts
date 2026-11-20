import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/** Channels offered at checkout. */
export const PAYSTACK_CHANNELS = ['card', 'bank_transfer'] as const;

export interface InitializeTransactionInput {
  email: string;
  /** Amount in kobo. */
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializedTransaction {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifiedTransaction {
  /** Paystack transaction status: success, failed, abandoned, pending, ongoing, … */
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string | null;
  paidAt: string | null;
  gatewayResponse: string | null;
}


@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);

  constructor(private readonly config: ConfigService) {}

  private get secretKey(): string {
    return this.config.getOrThrow<string>('PAYSTACK_SECRET_KEY');
  }

  /**
   * Paystack signs each webhook with HMAC-SHA512 of the raw request body,
   * keyed with the secret key, sent in the `x-paystack-signature` header.
   */
  verifySignature(rawBody: Buffer | string | undefined, signature: string | undefined): boolean {
    if (!rawBody || !signature || typeof signature !== 'string') return false;

    const expected = createHmac('sha512', this.secretKey).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature.trim().toLowerCase(), 'utf8');

    return a.length === b.length && timingSafeEqual(a, b);
  }

  async initializeTransaction(input: InitializeTransactionInput): Promise<InitializedTransaction> {
    const data = await this.request<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>('POST', '/transaction/initialize', {
      email: input.email,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: [...PAYSTACK_CHANNELS],
      metadata: input.metadata,
    });

    return {
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      reference: data.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<VerifiedTransaction> {
    const data = await this.request<{
      status: string;
      reference: string;
      amount: number;
      currency: string;
      channel?: string | null;
      paid_at?: string | null;
      gateway_response?: string | null;
    }>('GET', `/transaction/verify/${encodeURIComponent(reference)}`);

    return {
      status: data.status,
      reference: data.reference,
      amount: data.amount,
      currency: data.currency,
      channel: data.channel ?? null,
      paidAt: data.paid_at ?? null,
      gatewayResponse: data.gateway_response ?? null,
    };
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      this.logger.error(`Paystack ${method} ${path} unreachable: ${(err as Error).message}`);
      throw new BadGatewayException('The payment provider could not be reached.');
    }

    const json = (await response.json().catch(() => null)) as
      | { status?: boolean; message?: string; data?: T }
      | null;

    if (!response.ok || !json?.status || json.data === undefined) {
      this.logger.warn(
        `Paystack ${method} ${path} failed: HTTP ${response.status} ${json?.message ?? ''}`,
      );
      throw new BadGatewayException('The payment provider rejected the request.');
    }

    return json.data;
  }
}
