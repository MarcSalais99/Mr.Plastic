
import { Body, Controller, Get, Post } from '@nestjs/common';

import { InventoryMovementsService } from './inventory-movements.service.js';
import { InventoryMovement } from './entities/inventory-movement.entity.js';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto.js';

@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  @Get()
  findAll(): Promise<InventoryMovement[]> {
    return this.inventoryMovementsService.findAll();
  }

  @Post()
  create(
    @Body() dto: CreateInventoryMovementDto,
  ): Promise<InventoryMovement> {
    return this.inventoryMovementsService.create(dto);
  }
}
