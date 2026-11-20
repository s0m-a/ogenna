import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PaystackService } from './paystack.service';

const SECRET = 'sk_test_unit_test_secret';

const sign = (body: string | Buffer, secret = SECRET) =>
  createHmac('sha512', secret).update(body).digest('hex');

describe('PaystackService', () => {
  const config = {
    getOrThrow: jest.fn().mockReturnValue(SECRET),
  } as unknown as ConfigService;

  const service = new PaystackService(config);
  const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'OGN-1' } }));

  describe('verifySignature', () => {
    it('accepts the HMAC-SHA512 of the raw body keyed with the secret key', () => {
      expect(service.verifySignature(body, sign(body))).toBe(true);
    });

    it('accepts an upper-case hex signature', () => {
      expect(service.verifySignature(body, sign(body).toUpperCase())).toBe(true);
    });

    it('rejects a signature made with a different key', () => {
      expect(service.verifySignature(body, sign(body, 'sk_test_someone_else'))).toBe(false);
    });

    it('rejects when the body was altered after signing', () => {
      const tampered = Buffer.from(body.toString().replace('OGN-1', 'OGN-2'));
      expect(service.verifySignature(tampered, sign(body))).toBe(false);
    });

    it('is sensitive to raw bytes, not just JSON meaning', () => {
      const reSerialized = Buffer.from(JSON.stringify(JSON.parse(body.toString()), null, 2));
      expect(service.verifySignature(reSerialized, sign(body))).toBe(false);
    });

    it('rejects a missing, empty or malformed signature', () => {
      expect(service.verifySignature(body, undefined)).toBe(false);
      expect(service.verifySignature(body, '')).toBe(false);
      expect(service.verifySignature(body, 'not-a-signature')).toBe(false);
    });

    it('rejects a missing body', () => {
      expect(service.verifySignature(undefined, sign(body))).toBe(false);
    });
  });

  describe('initializeTransaction', () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
      fetchMock.mockReset();
      (global as any).fetch = fetchMock;
    });

    it('sends kobo amount, reference, callback_url and card + bank_transfer channels', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: true,
          data: { authorization_url: 'https://checkout.paystack.com/x', access_code: 'ac', reference: 'OGN-1' },
        }),
      });

      const result = await service.initializeTransaction({
        email: 'buyer@example.com',
        amount: 1_250_000,
        currency: 'NGN',
        reference: 'OGN-1',
        callbackUrl: 'http://localhost:3000/checkout/callback',
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.paystack.co/transaction/initialize');
      expect(init.headers.Authorization).toBe(`Bearer ${SECRET}`);
      expect(JSON.parse(init.body)).toMatchObject({
        email: 'buyer@example.com',
        amount: 1_250_000,
        currency: 'NGN',
        reference: 'OGN-1',
        callback_url: 'http://localhost:3000/checkout/callback',
        channels: ['card', 'bank_transfer'],
      });
      expect(result.authorizationUrl).toBe('https://checkout.paystack.com/x');
    });

    it('throws when Paystack rejects the request', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ status: false, message: 'Duplicate Transaction Reference' }),
      });

      await expect(
        service.initializeTransaction({
          email: 'buyer@example.com',
          amount: 100,
          currency: 'NGN',
          reference: 'OGN-1',
          callbackUrl: 'http://localhost:3000/checkout/callback',
        }),
      ).rejects.toThrow('The payment provider rejected the request.');
    });
  });
});
