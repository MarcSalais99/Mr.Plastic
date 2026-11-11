
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryMovement } from './entities/inventory-movement.entity.js';
import { BranchInventory } from '../branch-inventory/entities/branch-inventory.entity.js';
import { Branch } from '../branches/entities/branch.entity.js';
import { Product } from '../products/entities/product.entity.js';

import { InventoryMovementsService } from './inventory-movements.service.js';
import { InventoryMovementsController } from './inventory-movements.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryMovement,
      BranchInventory,
      Branch,
      Product,
    ]),
  ],
  providers: [InventoryMovementsService],
  controllers: [InventoryMovementsController],
  exports: [InventoryMovementsService],
})
export class InventoryMovementsModule {}
