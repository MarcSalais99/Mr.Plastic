import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BranchesService } from '../src/branches/branches.service.js';
import { Branch } from '../src/branches/entities/branch.entity.js';
import { ProductsService } from '../src/products/products.service.js';
import { Product } from '../src/products/entities/product.entity.js';

describe('BranchesService', () => {
  const branchesRepository = {
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  let service: BranchesService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: getRepositoryToken(Branch), useValue: branchesRepository },
      ],
    }).compile();
    service = module.get(BranchesService);
  });

  it('lists branches alphabetically', async () => {
    const branches = [{ id: 'branch-1', name: 'Centro' }];
    branchesRepository.find.mockResolvedValue(branches);

    await expect(service.findAll()).resolves.toBe(branches);
    expect(branchesRepository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
  });

  it('creates a branch and maps unique-constraint errors to conflicts', async () => {
    const dto = { name: 'Centro', address: 'Calle 1' };
    const branch = { ...dto, id: 'branch-1' };
    branchesRepository.create.mockReturnValue(branch);
    branchesRepository.save.mockResolvedValue(branch);

    await expect(service.create(dto)).resolves.toBe(branch);
    expect(branchesRepository.create).toHaveBeenCalledWith(dto);

    branchesRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      ),
    );
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ProductsService', () => {
  const productsRepository = {
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  let service: ProductsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productsRepository },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  it('lists products alphabetically', async () => {
    const products = [{ id: 'product-1', name: 'Tapa' }];
    productsRepository.find.mockResolvedValue(products);

    await expect(service.findAll()).resolves.toBe(products);
    expect(productsRepository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
  });

  it('creates products and translates duplicate SKU errors', async () => {
    const dto = { sku: 'SKU-1', name: 'Tapa', price: 12 };
    const product = { ...dto, id: 'product-1' };
    productsRepository.create.mockReturnValue(product);
    productsRepository.save.mockResolvedValue(product);

    await expect(service.create(dto)).resolves.toBe(product);
    expect(productsRepository.create).toHaveBeenCalledWith(dto);

    productsRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      ),
    );
    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows database errors unrelated to duplicate keys', async () => {
    const error = new Error('database unavailable');
    productsRepository.create.mockReturnValue({});
    productsRepository.save.mockRejectedValue(error);

    await expect(
      service.create({ sku: 'SKU-1', name: 'Tapa', price: 12 }),
    ).rejects.toBe(error);
  });
});
