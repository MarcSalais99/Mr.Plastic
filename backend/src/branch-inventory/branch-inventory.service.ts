
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { BranchInventory } from './entities/branch-inventory.entity.js';
import { Branch } from '../branches/entities/branch.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { CreateBranchInventoryDto } from './dto/create-branch-inventory.dto.js';

@Injectable()
export class BranchInventoryService {
  constructor(
    @InjectRepository(BranchInventory)
    private readonly inventoryRepository: Repository<BranchInventory>,

    @InjectRepository(Branch)
    private readonly branchesRepository: Repository<Branch>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<BranchInventory[]> {
    return this.inventoryRepository.find({
      relations: {
        branch: true,
        product: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async create(
    dto: CreateBranchInventoryDto,
  ): Promise<BranchInventory> {
    const branch = await this.branchesRepository.findOneBy({
      id: dto.branchId,
    });

    if (!branch) {
      throw new NotFoundException(
        'La sucursal indicada no existe',
      );
    }

    const product = await this.productsRepository.findOneBy({
      id: dto.productId,
    });

    if (!product) {
      throw new NotFoundException(
        'El producto indicado no existe',
      );
    }

    const existing = await this.inventoryRepository.findOne({
      where: {
        branch: { id: branch.id },
        product: { id: product.id },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existen existencias registradas para ese producto en esa sucursal',
      );
    }

    const inventory = this.inventoryRepository.create({
      branch,
      product,
      quantity: dto.quantity,
    });

    try {
      return await this.inventoryRepository.save(inventory);
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        typeof error.driverError === 'object' &&
        error.driverError !== null &&
        'code' in error.driverError &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException(
          'Ya existen existencias registradas para ese producto en esa sucursal',
        );
      }

      throw error;
    }
  }
}
