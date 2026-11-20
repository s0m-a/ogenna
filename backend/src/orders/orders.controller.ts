import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import { RateLimit } from '../common/throttle/rate-limits';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RateLimit.placeOrder()
  @UseGuards(OptionalJwtGuard)
  create(
    @Req() req: Request,
    @Headers('x-cart-token') guestToken: string | undefined,
    @Body() dto: CreateOrderDto,
  ) {
    const userId = (req as any).user?.sub as string | undefined;
    return this.ordersService.createFromCart(dto, { userId, guestToken });
  }

  @Get(':reference')
  @RateLimit.orderLookup()
  getByReference(@Param('reference') reference: string) {
    return this.ordersService.getByReference(reference);
  }

  /** Payment state for the callback page (Paystack Verify Transaction, display only). */
  @Get(':reference/verify')
  @RateLimit.verifyPayment()
  verify(@Param('reference') reference: string) {
    return this.ordersService.verifyForDisplay(reference);
  }
}
