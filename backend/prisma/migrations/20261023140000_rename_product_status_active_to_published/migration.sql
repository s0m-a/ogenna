-- Rename ACTIVE to PUBLISHED in ProductStatus enum using text-intermediate approach
-- (PostgreSQL does not support DROP VALUE on enums; ADD VALUE cannot be used in same txn)

-- Step 1: convert column to text to decouple from enum
ALTER TABLE "Product" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "status" TYPE TEXT;

-- Step 2: drop the old enum
DROP TYPE "ProductStatus";

-- Step 3: create new enum with PUBLISHED instead of ACTIVE
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Step 4: migrate any ACTIVE rows to PUBLISHED
UPDATE "Product" SET "status" = 'PUBLISHED' WHERE "status" = 'ACTIVE';

-- Step 5: restore column type
ALTER TABLE "Product"
  ALTER COLUMN "status" TYPE "ProductStatus"
  USING "status"::"ProductStatus";

ALTER TABLE "Product"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"ProductStatus";
