import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const articleLikes = sqliteTable(
  "article_likes",
  {
    id: text("id").primaryKey(),
    contentId: text("content_id").notNull(),
    userIp: text("user_ip").notNull(),
    secret: text("secret"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    contentIdIdx: index("idx_article_likes_content_id").on(table.contentId),
    userIpIdx: index("idx_article_likes_user_ip").on(table.userIp),
    createdAtIdx: index("idx_article_likes_created_at").on(table.createdAt),
  }),
);
