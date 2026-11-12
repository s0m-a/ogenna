import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.getOrThrow<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.getOrThrow<string>('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.logger.log(
      `Cloudinary configured: cloud="${cloudName}" keyLen=${apiKey.length} secretLen=${apiSecret.length} secretHasWhitespace=${/\s/.test(apiSecret)}`,
    );
  }

  signUpload(folder?: string): SignedUpload {
    const baseFolder = this.config.get<string>('CLOUDINARY_UPLOAD_FOLDER') ?? 'ogenna';
    const resolvedFolder = folder ? `${baseFolder}/${folder}` : baseFolder;
    const timestamp = Math.floor(Date.now() / 1000);
    const apiSecret = this.config.getOrThrow<string>('CLOUDINARY_API_SECRET');

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: resolvedFolder },
      apiSecret,
    );

    this.logger.debug(
      `[sign] folder="${resolvedFolder}" ts=${timestamp} sig=${signature.slice(0, 8)}… secretLen=${apiSecret.length}`,
    );

    return {
      cloudName: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      timestamp,
      signature,
      folder: resolvedFolder,
    };
  }

  async destroy(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
    } catch (err) {
      this.logger.warn(`Cloudinary destroy failed for ${publicId}: ${(err as Error).message}`);
    }
  }
}
