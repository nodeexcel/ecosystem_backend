/*
  Warnings:

  - Added the required column `teamId` to the `invite_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `teamMembers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invite_tokens" ADD COLUMN     "teamId" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "teamMembers" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamId" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "teamId" VARCHAR(255),
ALTER COLUMN "numberOfTeamMembers" SET DEFAULT 1;
