import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

@Module({
  imports: [DatabaseModule, AuthModule, OrdersModule],
  controllers: [CustomersController, AddressesController],
  providers: [CustomersService, AddressesService],
})
export class CustomersModule {}
