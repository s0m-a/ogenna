import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { SignUploadDto } from './dto/sign-upload.dto';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto';
import { UpdateMediaAssetDto } from './dto/update-media-asset.dto';
import { MediaQueryDto } from './dto/media-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('admin/media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'CONTENT_EDITOR')
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('sign')
  sign(@Body() dto: SignUploadDto) {
    return this.mediaService.signUpload(dto.folder);
  }

  @Get()
  findAll(@Query() query: MediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Get(':id/usages')
  usages(@Param('id') id: string) {
    return this.mediaService.findUsages(id);
  }

  @Post()
  create(@Body() dto: CreateMediaAssetDto, @CurrentUser() user: JwtPayload) {
    return this.mediaService.create(dto, user?.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaAssetDto) {
    return this.mediaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
