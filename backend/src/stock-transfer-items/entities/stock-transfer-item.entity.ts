
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity.js';
import { StockTransfer } from '../../stock-transfers/entities/stock-transfer.entity.js';

@Entity({ name: 'stock_transfer_items' })
@Unique('UQ_stock_transfer_items_transfer_product', ['transfer', 'product'])
@Check('CHK_stock_transfer_items_quantity_sent_positive', '"quantity_sent" > 0')
@Check(
  'CHK_stock_transfer_items_quantity_received_valid',
  '"quantity_received" >= 0 AND "quantity_received" <= "quantity_sent"',
)
export class StockTransferItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => StockTransfer, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'transfer_id' })
  transfer!: StockTransfer;

  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'quantity_sent', type: 'integer' })
  quantitySent!: number;

  @Column({ name: 'quantity_received', type: 'integer', default: 0 })
  quantityReceived!: number;
}
