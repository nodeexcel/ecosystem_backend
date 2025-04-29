/*
  Warnings:

  - You are about to drop the column `stripsubscriptionId` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "stripsubscriptionId",
ADD COLUMN     "subscriptionId" VARCHAR(100);
