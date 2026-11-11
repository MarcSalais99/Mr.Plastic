
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryMovement } from './entities/inventory-movement.entity.js';
import { BranchInventory } from '../branch-inventory/entities/branch-inventory.entity.js';
import { Branch } from '../branches/entities/branch.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto.js';

@Injectable()
export class InventoryMovementsService {
  constructor(
    private readonly dataSource: DataSource,

  ) {}


async findAll(): Promise<InventoryMovement[]> {
  return this.dataSource.getRepository(InventoryMovement).find({
    relations: { branch: true, product: true },
    order: { createdAt: 'DESC' },
  });
}


  async create(
    dto: CreateInventoryMovementDto,
  ): Promise<InventoryMovement> {
    return this.dataSource.transaction(async (manager) => {
      const branch = await manager.getRepository(Branch).findOneBy({
        id: dto.branchId,
      });

      if (!branch) {
        throw new NotFoundException('La sucursal indicada no existe');
      }

      const product = await manager.getRepository(Product).findOneBy({
        id: dto.productId,
      });

      if (!product) {
        throw new NotFoundException('El producto indicado no existe');
      }

      const inventoryRepository = manager.getRepository(BranchInventory);

      const inventory = await inventoryRepository.findOne({
        where: {
          branch: { id: branch.id },
          product: { id: product.id },
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!inventory) {
        throw new NotFoundException(
          'No existen existencias registradas para ese producto en esa sucursal',
        );
      }

      if (dto.movementType === 'EXIT' && inventory.quantity < dto.quantity) {
        throw new BadRequestException(
          'No hay existencias suficientes para realizar la salida',
        );
      }

      inventory.quantity =
        dto.movementType === 'ENTRY'
          ? inventory.quantity + dto.quantity
          : inventory.quantity - dto.quantity;

      await inventoryRepository.save(inventory);

      const movementRepository = manager.getRepository(InventoryMovement);

      const movement = movementRepository.create({
        branch,
        product,
        movementType: dto.movementType,
        quantity: dto.quantity,
        referenceType: dto.referenceType ?? null,
        referenceId: dto.referenceId ?? null,
      });

      return movementRepository.save(movement);
    });
  }
}
