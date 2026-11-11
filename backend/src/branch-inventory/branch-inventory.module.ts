
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BranchInventory } from './entities/branch-inventory.entity.js';
import { Branch } from '../branches/entities/branch.entity.js';
import { Product } from '../products/entities/product.entity.js';

import { BranchInventoryService } from './branch-inventory.service.js';
import { BranchInventoryController } from './branch-inventory.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BranchInventory,
      Branch,
      Product,
    ]),
  ],
  providers: [BranchInventoryService],
  controllers: [BranchInventoryController],
  exports: [BranchInventoryService],
})
export class BranchInventoryModule {}
