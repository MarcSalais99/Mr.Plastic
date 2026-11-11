import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCentralTables1792657091554 implements MigrationInterface {
    name = 'CreateCentralTables1792657091554'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "address" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "branch_inventory" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL DEFAULT '0', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "branch_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "UQ_branch_inventory_branch_product" UNIQUE ("branch_id", "product_id"), CONSTRAINT "CHK_branch_inventory_quantity_nonnegative" CHECK ("quantity" >= 0), CONSTRAINT "PK_c23766e60c8ee7150fdaaff3620" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "branch_product_prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "price" numeric(12,2) NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "branch_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "UQ_branch_product_prices_branch_product" UNIQUE ("branch_id", "product_id"), CONSTRAINT "CHK_branch_product_prices_price_nonnegative" CHECK ("price" >= 0), CONSTRAINT "PK_40e208f04915a740a2beeb272ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inventory_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "movement_type" character varying(30) NOT NULL, "quantity" integer NOT NULL, "reference_type" character varying(50), "reference_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "branch_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "CHK_inventory_movements_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" character varying(30) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "branch_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stock_transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying(30) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "dispatched_at" TIMESTAMP WITH TIME ZONE, "received_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "source_branch_id" uuid NOT NULL, "destination_branch_id" uuid NOT NULL, "created_by" uuid NOT NULL, CONSTRAINT "CHK_stock_transfers_different_branches" CHECK ("source_branch_id" <> "destination_branch_id"), CONSTRAINT "PK_ef738a3a4a578c7f1802c1bb50a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stock_transfer_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity_sent" integer NOT NULL, "quantity_received" integer NOT NULL DEFAULT '0', "transfer_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "UQ_stock_transfer_items_transfer_product" UNIQUE ("transfer_id", "product_id"), CONSTRAINT "CHK_stock_transfer_items_quantity_received_valid" CHECK ("quantity_received" >= 0 AND "quantity_received" <= "quantity_sent"), CONSTRAINT "CHK_stock_transfer_items_quantity_sent_positive" CHECK ("quantity_sent" > 0), CONSTRAINT "PK_8acee6121ab8a5135dc84495588" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sync_commands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(50) NOT NULL, "payload" jsonb NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "branch_id" uuid NOT NULL, CONSTRAINT "PK_389d9e29fc48bc2bfd1bed6c183" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sync_event_receipts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "event_type" character varying(50) NOT NULL, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "branch_id" uuid NOT NULL, CONSTRAINT "PK_92726db9b93deda99c566c1e786" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_sync_event_receipts_event_id" ON "sync_event_receipts"  ("event_id") `);
        await queryRunner.query(`ALTER TABLE "branch_inventory" ADD CONSTRAINT "FK_6cd826d26d62acf07e7ae226f75" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branch_inventory" ADD CONSTRAINT "FK_a7f6f7f9c8e609e43f8141aa5a0" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branch_product_prices" ADD CONSTRAINT "FK_7716910a14a7f96152f49380fa0" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branch_product_prices" ADD CONSTRAINT "FK_cb3c85dadd58ecb3e3b1c45df96" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_1ab8073a9fb9462a50ac175cb21" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_5c3bec1682252c36fa161587738" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_5a58f726a41264c8b3e86d4a1de" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_transfers" ADD CONSTRAINT "FK_8d1561d9321154322667da5d4c6" FOREIGN KEY ("source_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_transfers" ADD CONSTRAINT "FK_812fb1da08d4d2d9222210b80e4" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_transfers" ADD CONSTRAINT "FK_f7b8ce0d2d24cebaeb903d6cf5f" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "FK_6a0f024e84c92b964c516aa7b79" FOREIGN KEY ("transfer_id") REFERENCES "stock_transfers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "FK_cb5cee89889c9acfd70cd519810" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sync_commands" ADD CONSTRAINT "FK_4f0f2e750f59c53caaaf2c8b14f" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sync_event_receipts" ADD CONSTRAINT "FK_e3c2fbe99ec3c5cfdf17712f839" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sync_event_receipts" DROP CONSTRAINT "FK_e3c2fbe99ec3c5cfdf17712f839"`);
        await queryRunner.query(`ALTER TABLE "sync_commands" DROP CONSTRAINT "FK_4f0f2e750f59c53caaaf2c8b14f"`);
        await queryRunner.query(`ALTER TABLE "stock_transfer_items" DROP CONSTRAINT "FK_cb5cee89889c9acfd70cd519810"`);
        await queryRunner.query(`ALTER TABLE "stock_transfer_items" DROP CONSTRAINT "FK_6a0f024e84c92b964c516aa7b79"`);
        await queryRunner.query(`ALTER TABLE "stock_transfers" DROP CONSTRAINT "FK_f7b8ce0d2d24cebaeb903d6cf5f"`);
        await queryRunner.query(`ALTER TABLE "stock_transfers" DROP CONSTRAINT "FK_812fb1da08d4d2d9222210b80e4"`);
        await queryRunner.query(`ALTER TABLE "stock_transfers" DROP CONSTRAINT "FK_8d1561d9321154322667da5d4c6"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_5a58f726a41264c8b3e86d4a1de"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_5c3bec1682252c36fa161587738"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_1ab8073a9fb9462a50ac175cb21"`);
        await queryRunner.query(`ALTER TABLE "branch_product_prices" DROP CONSTRAINT "FK_cb3c85dadd58ecb3e3b1c45df96"`);
        await queryRunner.query(`ALTER TABLE "branch_product_prices" DROP CONSTRAINT "FK_7716910a14a7f96152f49380fa0"`);
        await queryRunner.query(`ALTER TABLE "branch_inventory" DROP CONSTRAINT "FK_a7f6f7f9c8e609e43f8141aa5a0"`);
        await queryRunner.query(`ALTER TABLE "branch_inventory" DROP CONSTRAINT "FK_6cd826d26d62acf07e7ae226f75"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_sync_event_receipts_event_id"`);
        await queryRunner.query(`DROP TABLE "sync_event_receipts"`);
        await queryRunner.query(`DROP TABLE "sync_commands"`);
        await queryRunner.query(`DROP TABLE "stock_transfer_items"`);
        await queryRunner.query(`DROP TABLE "stock_transfers"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "inventory_movements"`);
        await queryRunner.query(`DROP TABLE "branch_product_prices"`);
        await queryRunner.query(`DROP TABLE "branch_inventory"`);
        await queryRunner.query(`DROP TABLE "branches"`);
    }

}
