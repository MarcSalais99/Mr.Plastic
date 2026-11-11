import { Test, TestingModule } from '@nestjs/testing';
import { BranchInventoryController } from './branch-inventory.controller.js';
import { BranchInventoryService } from './branch-inventory.service.js';

describe('BranchInventoryController', () => {
  let controller: BranchInventoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchInventoryController],
      providers: [{ provide: BranchInventoryService, useValue: {} }],
    }).compile();

    controller = module.get<BranchInventoryController>(BranchInventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
