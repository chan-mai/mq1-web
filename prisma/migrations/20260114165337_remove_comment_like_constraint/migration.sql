-- DropIndex
DROP INDEX "comment_likes_comment_id_user_ip_key";

-- CreateIndex
CREATE INDEX "comment_likes_user_ip_idx" ON "comment_likes"("user_ip");
