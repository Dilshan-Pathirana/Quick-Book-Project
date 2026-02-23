/*
  Warnings:

  - Added the required column `updated_at` to the `equipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "description" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
