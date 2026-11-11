
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

@Entity({ name: 'branch_product_prices' })
@Unique('UQ_branch_product_prices_branch_product', ['branch', 'product'])
@Check('CHK_branch_product_prices_price_nonnegative', '"price" >= 0')
export class BranchProductPrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
