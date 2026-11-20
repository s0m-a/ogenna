import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { OrdersService } from '../orders/orders.service';
import { CustomersService } from './customers.service';
import { CustomerOrdersQueryDto } from './dto/customer-orders-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RateLimit } from '../common/throttle/rate-limits';


@Controller('customers/me')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly customers: CustomersService,
    private readonly orders: OrdersService,
  ) {}

  @Get()
  me(@CurrentUser() user: JwtPayload) {
    return this.customers.getProfile(user.sub);
  }

  @Patch()
  @RateLimit.accountWrite()
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.customers.updateProfile(user.sub, dto);
  }

  @Get('orders')
  myOrders(@CurrentUser() user: JwtPayload, @Query() query: CustomerOrdersQueryDto) {
    return this.orders.listForCustomer(user.sub, query.page, query.limit);
  }
}
