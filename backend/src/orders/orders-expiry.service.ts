import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';


@Injectable()
export class OrdersExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersExpiryService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly orders: OrdersService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    if (this.config.get('NODE_ENV') === 'test') return;

    const seconds = Number(this.config.get('ORDER_EXPIRY_SWEEP_SECONDS') ?? 60);
    this.timer = setInterval(() => void this.sweep(), seconds * 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async sweep(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const expired = await this.orders.expireStale();
      if (expired > 0) this.logger.log(`Expired ${expired} unpaid order(s).`);
    } catch (err) {
      this.logger.error(`Order expiry sweep failed: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
