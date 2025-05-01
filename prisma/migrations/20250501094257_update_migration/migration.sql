/*
  Warnings:

  - You are about to drop the column `curreny` on the `transaction_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transaction_history" DROP COLUMN "curreny",
ADD COLUMN     "currency" TEXT;
