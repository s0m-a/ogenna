import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersController } from './orders.controller';
import { OrdersExpiryService } from './orders-expiry.service';
import { OrdersService } from './orders.service';
import { PaystackWebhookController } from './paystack-webhook.controller';

@Module({
  imports: [DatabaseModule, AuthModule, PaymentsModule],
  controllers: [OrdersController, AdminOrdersController, PaystackWebhookController],
  providers: [OrdersService, OrdersExpiryService],
  exports: [OrdersService],
})
export class OrdersModule {}
