import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { STORE_CURRENCY } from '../common/constants/currency';
import { CartsService } from './carts.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(OptionalJwtGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  /**
   * GET or create the caller's cart.
   * - Authenticated: resolved by JWT userId.
   * - Guest: resolved by X-Cart-Token header; token returned in response.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async getOrCreate(
    @Req() req: Request,
    @Headers('x-cart-token') guestToken?: string,
  ) {
    const userId = (req as any).user?.sub as string | undefined;

    if (userId) {
      return this.cartsService.getOrCreateForUser(userId);
    }

    const token = guestToken ?? this.generateGuestToken();
    return this.cartsService.getOrCreateForGuest(token);
  }

  @Get()
  async getCart(
    @Req() req: Request,
    @Headers('x-cart-token') guestToken?: string,
  ) {
    const userId = (req as any).user?.sub as string | undefined;

    if (userId) return this.cartsService.getForUser(userId);

    if (!guestToken) {
      return { id: null, items: [], itemCount: 0, subtotalAmount: 0, currencyCode: STORE_CURRENCY };
    }

    return this.cartsService.getForGuest(guestToken);
  }

  @Post('items')
  async addItem(
    @Req() req: Request,
    @Headers('x-cart-token') guestToken: string | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    const cart = await this.resolveCart(req, guestToken);
    return this.cartsService.addItem(cart.id, dto);
  }

  @Patch('items/:id')
  async updateItem(
    @Req() req: Request,
    @Headers('x-cart-token') guestToken: string | undefined,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const cart = await this.resolveCart(req, guestToken);
    await this.cartsService.assertOwnership(cart.id, (req as any).user?.sub, guestToken);
    return this.cartsService.updateItem(cart.id, itemId, dto);
  }

  @Delete('items/:id')
  async removeItem(
    @Req() req: Request,
    @Headers('x-cart-token') guestToken: string | undefined,
    @Param('id') itemId: string,
  ) {
    const cart = await this.resolveCart(req, guestToken);
    await this.cartsService.assertOwnership(cart.id, (req as any).user?.sub, guestToken);
    return this.cartsService.removeItem(cart.id, itemId);
  }

  /**
   * Merge a guest cart into the authenticated user's cart.
   * Called after login when the client holds a guest token.
   */
  @Post('merge')
  @UseGuards(OptionalJwtGuard)
  async mergeCart(
    @Req() req: Request,
    @Headers('x-cart-token') guestToken: string,
  ) {
    const userId = (req as any).user?.sub as string | undefined;

    if (!userId) {
      return { message: 'Authentication required to merge cart.' };
    }

    if (!guestToken) {
      return this.cartsService.getOrCreateForUser(userId);
    }

    return this.cartsService.mergeGuestIntoUser(guestToken, userId);
  }

  private async resolveCart(req: Request, guestToken?: string) {
    const userId = (req as any).user?.sub as string | undefined;

    if (userId) {
      return this.cartsService.getOrCreateForUser(userId);
    }

    if (!guestToken) {
      const token = this.generateGuestToken();
      return this.cartsService.getOrCreateForGuest(token);
    }

    return this.cartsService.getOrCreateForGuest(guestToken);
  }

  private generateGuestToken(): string {
    return crypto.randomUUID();
  }
}
