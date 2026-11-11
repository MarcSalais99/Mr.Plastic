
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPriceToProducts1792636042876
  implements MigrationInterface
{
  name = 'AddPriceToProducts1792636042876';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "price" numeric(12, 2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "price"
    `);
  }
}
