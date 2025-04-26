-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeCustomerId" VARCHAR(50);

-- CreateTable
CREATE TABLE "sessionId" (
    "id" INTEGER NOT NULL,
    "session" VARCHAR(225) NOT NULL,

    CONSTRAINT "sessionId_pkey" PRIMARY KEY ("id")
);
