
import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Branch } from '../branches/entities/branch.entity.js';
import { BranchInventory } from '../branch-inventory/entities/branch-inventory.entity.js';
import { BranchProductPrice } from '../branch-product-prices/entities/branch-product-price.entity.js';
import { InventoryMovement } from '../inventory-movements/entities/inventory-movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { StockTransferItem } from '../stock-transfer-items/entities/stock-transfer-item.entity.js';
import { StockTransfer } from '../stock-transfers/entities/stock-transfer.entity.js';
import { SyncCommand } from '../sync-commands/entities/sync-command.entity.js';
import { SyncEventReceipt } from '../sync-event-receipts/entities/sync-event-receipt.entity.js';
import { User } from '../users/entities/user.entity.js';

export const CentralDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [
    Branch,
    Product,
    BranchInventory,
    User,
    BranchProductPrice,
    InventoryMovement,
    SyncCommand,
    SyncEventReceipt,
    StockTransfer,
    StockTransferItem,
  ],

  migrations: ['src/database/migrations/central/*.ts'],
  migrationsTableName: 'migrations',

  synchronize: false,
  migrationsRun: false,
});
