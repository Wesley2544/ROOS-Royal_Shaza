-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;
