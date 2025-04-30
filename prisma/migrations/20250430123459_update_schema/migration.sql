/*
  Warnings:

  - Added the required column `role` to the `invite_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'Guest';

-- AlterTable
ALTER TABLE "invite_tokens" ADD COLUMN     "role" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "teamMembers" ADD COLUMN     "role" "Role";
