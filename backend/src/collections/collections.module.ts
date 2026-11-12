import { Module } from '@nestjs/common';
import { CollectionsController, AdminCollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CollectionsController, AdminCollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
