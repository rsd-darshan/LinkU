-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_channelId_fkey";

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "channelId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
