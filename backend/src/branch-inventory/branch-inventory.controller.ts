
import { Body, Controller, Get, Post } from '@nestjs/common';
import { BranchInventoryService } from './branch-inventory.service.js';
import { BranchInventory } from './entities/branch-inventory.entity.js';
import { CreateBranchInventoryDto } from './dto/create-branch-inventory.dto.js';

@Controller('branch-inventory')
export class BranchInventoryController {
  constructor(
    private readonly inventoryService: BranchInventoryService,
  ) {}

  @Get()
  findAll(): Promise<BranchInventory[]> {
    return this.inventoryService.findAll();
  }

  @Post()
  create(
    @Body() dto: CreateBranchInventoryDto,
  ): Promise<BranchInventory> {
    return this.inventoryService.create(dto);
  }
}
