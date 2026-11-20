import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CollectionsModule } from './collections/collections.module';
import { InventoryModule } from './inventory/inventory.module';
import { CartsModule } from './carts/carts.module';
import { MediaModule } from './media/media.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { envValidationSchema } from './config/env.validation';
import { RateLimitModule } from './common/throttle/rate-limit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    RateLimitModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CollectionsModule,
    InventoryModule,
    CartsModule,
    MediaModule,
    OrdersModule,
    CustomersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
