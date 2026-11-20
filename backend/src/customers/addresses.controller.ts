import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RateLimit } from '../common/throttle/rate-limits';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Controller('customers/me/addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.addresses.list(user.sub);
  }

  @Post()
  @RateLimit.accountWrite()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAddressDto) {
    return this.addresses.create(user.sub, dto);
  }

  @Patch(':id')
  @RateLimit.accountWrite()
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addresses.update(user.sub, id, dto);
  }

  @Post(':id/default')
  @HttpCode(HttpStatus.OK)
  @RateLimit.accountWrite()
  setDefault(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.addresses.setDefault(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit.accountWrite()
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.addresses.remove(user.sub, id);
  }
}
