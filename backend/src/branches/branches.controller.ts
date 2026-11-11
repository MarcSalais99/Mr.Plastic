
import { Body, Controller, Get, Post } from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { Branch } from './entities/branch.entity.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';

@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
  ) {}

  @Get()
  findAll(): Promise<Branch[]> {
    return this.branchesService.findAll();
  }

  @Post()
  create(
    @Body() createBranchDto: CreateBranchDto,
  ): Promise<Branch> {
    return this.branchesService.create(createBranchDto);
  }
}
