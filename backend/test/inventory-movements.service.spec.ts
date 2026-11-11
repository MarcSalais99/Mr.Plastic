import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventoryMovementsService } from '../src/inventory-movements/inventory-movements.service.js';
import { InventoryMovement } from '../src/inventory-movements/entities/inventory-movement.entity.js';
import { BranchInventory } from '../src/branch-inventory/entities/branch-inventory.entity.js';
import { Branch } from '../src/branches/entities/branch.entity.js';
import { Product } from '../src/products/entities/product.entity.js';

describe('InventoryMovementsService', () => {
  const branchesRepository = { findOneBy: vi.fn() };
  const productsRepository = { findOneBy: vi.fn() };
  const inventoryRepository = { findOne: vi.fn(), save: vi.fn() };
  const movementsRepository = { create: vi.fn(), save: vi.fn() };
  const repositories = new Map<Function, object>([
    [Branch, branchesRepository],
    [Product, productsRepository],
    [BranchInventory, inventoryRepository],
    [InventoryMovement, movementsRepository],
  ]);
  const manager = {
    getRepository: vi.fn((entity: Function) => repositories.get(entity)),
  };
  const dataSource = {
    getRepository: vi.fn(),
    transaction: vi.fn(),
  };
  let service: InventoryMovementsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    dataSource.transaction.mockImplementation(async (work) => work(manager));
    const module = await Test.createTestingModule({
      providers: [
        InventoryMovementsService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(InventoryMovementsService);
  });

  it('adds stock and stores an entry movement in one transaction', async () => {
    const branch = { id: 'branch-1' };
    const product = { id: 'product-1' };
    const inventory = { quantity: 4 };
    const movement = { id: 'movement-1' };
    branchesRepository.findOneBy.mockResolvedValue(branch);
    productsRepository.findOneBy.mockResolvedValue(product);
    inventoryRepository.findOne.mockResolvedValue(inventory);
    movementsRepository.create.mockReturnValue(movement);
    movementsRepository.save.mockResolvedValue(movement);

    await expect(
      service.create({
        branchId: 'branch-1',
        productId: 'product-1',
        movementType: 'ENTRY',
        quantity: 3,
      }),
    ).resolves.toBe(movement);

    expect(inventory.quantity).toBe(7);
    expect(inventoryRepository.save).toHaveBeenCalledWith(inventory);
    expect(movementsRepository.create).toHaveBeenCalledWith({
      branch,
      product,
      movementType: 'ENTRY',
      quantity: 3,
      referenceType: null,
      referenceId: null,
    });
    expect(dataSource.transaction).toHaveBeenCalledOnce();
  });

  it('subtracts stock for exits and rejects insufficient quantity', async () => {
    branchesRepository.findOneBy.mockResolvedValue({ id: 'branch-1' });
    productsRepository.findOneBy.mockResolvedValue({ id: 'product-1' });
    const inventory = { quantity: 7 };
    inventoryRepository.findOne.mockResolvedValue(inventory);
    movementsRepository.create.mockReturnValue({});
    movementsRepository.save.mockResolvedValue({});

    await service.create({
      branchId: 'branch-1',
      productId: 'product-1',
      movementType: 'EXIT',
      quantity: 5,
    });
    expect(inventory.quantity).toBe(2);

    inventory.quantity = 2;
    inventoryRepository.save.mockClear();
    await expect(
      service.create({
        branchId: 'branch-1',
        productId: 'product-1',
        movementType: 'EXIT',
        quantity: 3,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(inventoryRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a missing branch, product, or inventory record', async () => {
    const dto = {
      branchId: 'branch-1',
      productId: 'product-1',
      movementType: 'ENTRY' as const,
      quantity: 1,
    };

    branchesRepository.findOneBy.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);

    branchesRepository.findOneBy.mockResolvedValue({ id: 'branch-1' });
    productsRepository.findOneBy.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);

    productsRepository.findOneBy.mockResolvedValue({ id: 'product-1' });
    inventoryRepository.findOne.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
  });
});
