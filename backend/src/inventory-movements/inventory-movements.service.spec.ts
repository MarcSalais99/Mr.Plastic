import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { InventoryMovementsService } from './inventory-movements.service.js';

describe('InventoryMovementsService', () => {
  let service: InventoryMovementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryMovementsService,
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<InventoryMovementsService>(InventoryMovementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
