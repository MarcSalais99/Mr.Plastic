
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto/create-product.dto.js';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.create(createProductDto);
  }
}
