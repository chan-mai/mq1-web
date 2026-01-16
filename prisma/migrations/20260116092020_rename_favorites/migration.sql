-- AlterEnum
ALTER TYPE "Permission" ADD VALUE 'LIKE_VIEW';
ALTER TYPE "Permission" ADD VALUE 'LIKE_ADMIN';

-- Update existing permissions
UPDATE "admin_permissions" SET permission = 'LIKE_VIEW' WHERE permission = 'FAVORITE_VIEW';
UPDATE "admin_permissions" SET permission = 'LIKE_ADMIN' WHERE permission = 'FAVORITE_ADMIN';

-- Now safe to drop old enum values
ALTER TYPE "Permission" DROP VALUE 'FAVORITE_VIEW';
ALTER TYPE "Permission" DROP VALUE 'FAVORITE_ADMIN';

-- Rename Table matches @@map("article_likes")
ALTER TABLE "favorites" RENAME TO "article_likes";

-- Rename Primary Key Constraint (Optional but good for consistency)
ALTER TABLE "article_likes" RENAME CONSTRAINT "favorites_pkey" TO "article_likes_pkey";

-- Rename Indices
ALTER INDEX "favorites_content_id_idx" RENAME TO "article_likes_content_id_idx";
ALTER INDEX "favorites_user_ip_idx" RENAME TO "article_likes_user_ip_idx";

