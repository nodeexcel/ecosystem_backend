/*
  Warnings:

  - You are about to alter the column `email` on the `transaction_history` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(50)`.

*/
-- AlterTable
CREATE SEQUENCE teammembers_id_seq;
ALTER TABLE "teamMembers" ALTER COLUMN "id" SET DEFAULT nextval('teammembers_id_seq');
ALTER SEQUENCE teammembers_id_seq OWNED BY "teamMembers"."id";

-- AlterTable
ALTER TABLE "transaction_history" ALTER COLUMN "email" SET DATA TYPE VARCHAR(50);
