-- AlterTable
ALTER TABLE "users" ALTER COLUMN "isProfileComplete" SET DEFAULT false,
ALTER COLUMN "subscriptionType" DROP NOT NULL;
