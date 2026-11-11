
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity.js';
import { Product } from '../../products/entities/product.entity.js';

@Entity({ name: 'branch_inventory' })
@Unique('UQ_branch_inventory_branch_product', ['branch', 'product'])
@Check('CHK_branch_inventory_quantity_nonnegative', '"quantity" >= 0')
export class BranchInventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'integer', default: 0 })
  quantity!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
