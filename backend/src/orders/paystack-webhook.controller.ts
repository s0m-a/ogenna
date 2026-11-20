import { Controller, Headers, HttpCode, HttpStatus, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';

// Paystack may burst retries from a few IPs; every call is signature-verified instead.
@SkipThrottle()
@Controller('payments/paystack')
export class PaystackWebhookController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Paystack event receiver. Authenticated solely by the x-paystack-signature
   * header (HMAC-SHA512 of the raw body). Always answers 200 for a correctly
   * signed event so Paystack does not retry events we have already handled.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string | undefined,
  ) {
    return this.ordersService.handlePaystackWebhook(req.rawBody, signature);
  }
}
