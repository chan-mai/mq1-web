/*
  Warnings:

  - You are about to drop the `admin_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `admin_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comment_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feed_access_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "admin_permissions" DROP CONSTRAINT "admin_permissions_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_parent_comment_id_fkey";

-- DropTable
DROP TABLE "admin_permissions";

-- DropTable
DROP TABLE "admin_users";

-- DropTable
DROP TABLE "comment_likes";

-- DropTable
DROP TABLE "comments";

-- DropTable
DROP TABLE "feed_access_logs";

-- DropEnum
DROP TYPE "CommentStatus";

-- DropEnum
DROP TYPE "Permission";
