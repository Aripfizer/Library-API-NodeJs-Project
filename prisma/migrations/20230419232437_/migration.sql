/*
  Warnings:

  - You are about to drop the column `loanId` on the `Book` table. All the data in the column will be lost.
  - Added the required column `bookId` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_loanId_fkey";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "loanId";

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "bookId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
