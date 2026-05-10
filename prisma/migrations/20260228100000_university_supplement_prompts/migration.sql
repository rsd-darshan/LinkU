-- AlterTable
ALTER TABLE "University" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "University" ADD COLUMN IF NOT EXISTS "supplementPromptsJson" JSONB;
