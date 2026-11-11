import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialProducts1792489791521 implements MigrationInterface {
    name = 'InitialProducts1792489791521'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "sku" character varying(50) NOT NULL,
                "name" character varying(150) NOT NULL,
                "description" text,
                "unit" character varying(30) NOT NULL DEFAULT 'pieza',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"),
                CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "products"
        `);
    }

}
