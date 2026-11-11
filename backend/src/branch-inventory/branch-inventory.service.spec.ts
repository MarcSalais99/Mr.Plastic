import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BranchInventoryService } from './branch-inventory.service.js';
import { BranchInventory } from './entities/branch-inventory.entity.js';
import { Branch } from '../branches/entities/branch.entity.js';
import { Product } from '../products/entities/product.entity.js';

describe('BranchInventoryService', () => {
  let service: BranchInventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchInventoryService,
        { provide: getRepositoryToken(BranchInventory), useValue: {} },
        { provide: getRepositoryToken(Branch), useValue: {} },
        { provide: getRepositoryToken(Product), useValue: {} },
      ],
    }).compile();

    service = module.get<BranchInventoryService>(BranchInventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
