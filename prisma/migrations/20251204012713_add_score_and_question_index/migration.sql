-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0;
