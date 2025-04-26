-- CreateEnum
CREATE TYPE "Role" AS ENUM ('User', 'Admin');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" VARCHAR(30),
ADD COLUMN     "company" VARCHAR(50),
ADD COLUMN     "country" VARCHAR(50),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'User';
