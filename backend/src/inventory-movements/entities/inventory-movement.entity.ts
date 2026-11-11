
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity.js';
import { Product } from '../../products/entities/product.entity.js';

@Entity({ name: 'inventory_movements' })
@Check(
  'CHK_inventory_movements_quantity_positive',
  '"quantity" > 0',
)

export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'movement_type', type: 'varchar', length: 30 })
  movementType!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  referenceType!: string | null;

  @Column({
    name: 'reference_id',
    type: 'uuid',
    nullable: true,
  })
  referenceId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
