/*
  Warnings:

  - Added the required column `email` to the `transaction_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transaction_history" ADD COLUMN     "email" VARCHAR(100) NOT NULL;
