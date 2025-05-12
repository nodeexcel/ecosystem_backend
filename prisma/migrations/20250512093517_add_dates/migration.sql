-- AlterTable
ALTER TABLE "users" ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionUpdatedAt" TIMESTAMP(3);
