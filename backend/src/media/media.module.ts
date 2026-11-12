import { Module } from '@nestjs/common';
import { AdminMediaController } from './media.controller';
import { MediaService } from './media.service';
import { CloudinaryService } from './cloudinary.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminMediaController],
  providers: [MediaService, CloudinaryService],
  exports: [MediaService],
})
export class MediaModule {}
