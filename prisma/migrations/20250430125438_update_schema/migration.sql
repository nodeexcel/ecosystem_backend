/*
  Warnings:

  - Changed the type of `role` on the `invite_tokens` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `role` on table `teamMembers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "invite_tokens" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- AlterTable
ALTER TABLE "teamMembers" ALTER COLUMN "role" SET NOT NULL;
