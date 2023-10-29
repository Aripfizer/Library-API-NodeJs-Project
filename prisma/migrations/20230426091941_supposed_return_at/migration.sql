/*
  Warnings:

  - Added the required column `supposedReturnAt` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "supposedReturnAt" TIMESTAMP(3) NOT NULL;
