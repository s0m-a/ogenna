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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminProductQueryDto, ProductQueryDto } from './dto/product-query.dto';
import { LogSearchDto, ProductSearchQueryDto } from './dto/product-search.dto';
import { ProductSearchService } from './product-search.service';
import { RateLimit } from '../common/throttle/rate-limits';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productSearch: ProductSearchService,
  ) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  // Declared before ':slug' so "search" isn't read as a product slug.
  @Get('search')
  @RateLimit.search()
  search(@Query() query: ProductSearchQueryDto) {
    return this.productsService.searchPublished(query.q, query.limit);
  }

  @Post('search/log')
  @RateLimit.searchLog()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logSearch(@Body() dto: LogSearchDto) {
    await this.productSearch.record(dto.q);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'CONTENT_EDITOR')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: AdminProductQueryDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.productsService.publish(id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.productsService.unpublish(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.productsService.duplicate(id);
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.productsService.archive(id);
  }
}
