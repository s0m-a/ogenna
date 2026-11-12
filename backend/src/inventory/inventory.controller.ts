import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';

@Controller('admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'INVENTORY_MANAGER')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  listInventory(@Query() query: InventoryQueryDto) {
    return this.inventoryService.listInventory(query);
  }

  @Get(':variantId')
  getByVariantId(@Param('variantId') variantId: string) {
    return this.inventoryService.getByVariantId(variantId);
  }

  @Get(':variantId/movements')
  getMovements(@Param('variantId') variantId: string) {
    return this.inventoryService.getMovements(variantId);
  }

  @Post('adjustments')
  adjust(@Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjust(dto);
  }
}
