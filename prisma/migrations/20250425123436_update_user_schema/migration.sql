/*
  Warnings:

  - Added the required column `isProfileComplete` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscriptionType` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Subscription" AS ENUM ('pro', 'business', 'team', 'enterprise');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isProfileComplete" BOOLEAN NOT NULL,
ADD COLUMN     "paymentId" VARCHAR(100),
ADD COLUMN     "subscriptionType" "Subscription" NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;
