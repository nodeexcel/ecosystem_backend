-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activeProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" VARCHAR(6);
