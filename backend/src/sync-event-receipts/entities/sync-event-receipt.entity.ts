
import {
  JoinColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity.js';

@Entity({ name: 'sync_event_receipts' })
@Index('UQ_sync_event_receipts_event_id', ['eventId'], { unique: true })
export class SyncEventReceipt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

 @ManyToOne(() => Branch, {
  nullable: false,
  onDelete: 'RESTRICT',
})
@JoinColumn({ name: 'branch_id' })
branch!: Branch;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType!: string;

  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' })
  receivedAt!: Date;
}
