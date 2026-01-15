-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('COMMENT_VIEW', 'COMMENT_ADMIN', 'FAVORITE_VIEW', 'FAVORITE_ADMIN', 'ADMIN_USER_VIEW', 'ADMIN_USER_ADMIN', 'FEED_STATS_VIEW');

-- CreateTable
CREATE TABLE "favorites" (
    "id" STRING NOT NULL,
    "content_id" STRING NOT NULL,
    "user_ip" STRING NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" STRING NOT NULL,
    "content_id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "comment" STRING NOT NULL,
    "user_ip" STRING NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" STRING NOT NULL,
    "github_username" STRING NOT NULL,
    "github_user_id" INT8 NOT NULL,
    "display_name" STRING,
    "email" STRING,
    "avatar_url" STRING,
    "is_active" BOOL NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" STRING NOT NULL,
    "admin_id" STRING NOT NULL,
    "permission" "Permission" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_access_logs" (
    "id" STRING NOT NULL,
    "user_agent" STRING,
    "reader_type" STRING,
    "ip_address" STRING NOT NULL,
    "referer" STRING,
    "accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorites_content_id_idx" ON "favorites"("content_id");

-- CreateIndex
CREATE INDEX "favorites_user_ip_idx" ON "favorites"("user_ip");

-- CreateIndex
CREATE INDEX "comments_content_id_idx" ON "comments"("content_id");

-- CreateIndex
CREATE INDEX "comments_user_ip_idx" ON "comments"("user_ip");

-- CreateIndex
CREATE INDEX "comments_status_idx" ON "comments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_github_username_key" ON "admin_users"("github_username");

-- CreateIndex
CREATE INDEX "admin_users_github_username_idx" ON "admin_users"("github_username");

-- CreateIndex
CREATE INDEX "admin_users_is_active_idx" ON "admin_users"("is_active");

-- CreateIndex
CREATE INDEX "admin_permissions_admin_id_idx" ON "admin_permissions"("admin_id");

-- CreateIndex
CREATE INDEX "admin_permissions_permission_idx" ON "admin_permissions"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permissions_admin_id_permission_key" ON "admin_permissions"("admin_id", "permission");

-- CreateIndex
CREATE INDEX "feed_access_logs_accessed_at_idx" ON "feed_access_logs"("accessed_at");

-- CreateIndex
CREATE INDEX "feed_access_logs_reader_type_idx" ON "feed_access_logs"("reader_type");

-- CreateIndex
CREATE INDEX "feed_access_logs_ip_address_accessed_at_idx" ON "feed_access_logs"("ip_address", "accessed_at");

-- AddForeignKey
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
