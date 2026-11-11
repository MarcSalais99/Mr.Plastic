import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BranchInventoryService } from '../src/branch-inventory/branch-inventory.service.js';
import { BranchInventory } from '../src/branch-inventory/entities/branch-inventory.entity.js';
import { Branch } from '../src/branches/entities/branch.entity.js';
import { Product } from '../src/products/entities/product.entity.js';

describe('BranchInventoryService', () => {
  const inventoryRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  const branchesRepository = {
    findOneBy: vi.fn(),
  };
  const productsRepository = {
    findOneBy: vi.fn(),
  };
  let service: BranchInventoryService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BranchInventoryService,
        {
          provide: getRepositoryToken(BranchInventory),
          useValue: inventoryRepository,
        },
        { provide: getRepositoryToken(Branch), useValue: branchesRepository },
        { provide: getRepositoryToken(Product), useValue: productsRepository },
      ],
    }).compile();
    service = module.get(BranchInventoryService);
  });

  it('lists inventory with branch and product details', async () => {
    const inventory = [{ quantity: 5 }];
    inventoryRepository.find.mockResolvedValue(inventory);

    await expect(service.findAll()).resolves.toBe(inventory);
    expect(inventoryRepository.find).toHaveBeenCalledWith({
      relations: { branch: true, product: true },
      order: { updatedAt: 'DESC' },
    });
  });

  it('creates inventory for an existing branch and product', async () => {
    const branch = { id: 'branch-1' };
    const product = { id: 'product-1' };
    const dto = { branchId: 'branch-1', productId: 'product-1', quantity: 8 };
    const record = { branch, product, quantity: 8 };
    branchesRepository.findOneBy.mockResolvedValue(branch);
    productsRepository.findOneBy.mockResolvedValue(product);
    inventoryRepository.findOne.mockResolvedValue(null);
    inventoryRepository.create.mockReturnValue(record);
    inventoryRepository.save.mockResolvedValue(record);

    await expect(service.create(dto)).resolves.toBe(record);
    expect(inventoryRepository.create).toHaveBeenCalledWith(record);
    expect(inventoryRepository.save).toHaveBeenCalledWith(record);
  });

  it('rejects missing branches, missing products, and duplicate records', async () => {
    const dto = { branchId: 'branch-1', productId: 'product-1', quantity: 8 };
    branchesRepository.findOneBy.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);

    branchesRepository.findOneBy.mockResolvedValue({ id: 'branch-1' });
    productsRepository.findOneBy.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);

    productsRepository.findOneBy.mockResolvedValue({ id: 'product-1' });
    inventoryRepository.findOne.mockResolvedValue({ id: 'existing' });
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });
});
