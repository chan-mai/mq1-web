import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const articleLikes = sqliteTable(
  'article_likes',
  {
    id: text('id').primaryKey(),
    contentId: text('content_id').notNull(),
    userIp: text('user_ip').notNull(),
    secret: text('secret'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    contentIdIdx: index('idx_article_likes_content_id').on(table.contentId),
    userIpIdx: index('idx_article_likes_user_ip').on(table.userIp),
    createdAtIdx: index('idx_article_likes_created_at').on(table.createdAt),
  }),
);

export const articles = sqliteTable(
  'articles',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull().default(''),
    content: text('content').notNull().default('{"type":"doc","content":[]}'),
    plainText: text('plain_text').notNull().default(''),
    summary: text('summary'),
    charCount: integer('char_count').notNull().default(0),
    eyecatchKey: text('eyecatch_key'),
    eyecatchWidth: integer('eyecatch_width'),
    eyecatchHeight: integer('eyecatch_height'),
    isNoIndex: integer('is_no_index', { mode: 'boolean' })
      .notNull()
      .default(false),
    status: text('status', { enum: ['draft', 'published', 'private'] })
      .notNull()
      .default('draft'),
    publishedAt: text('published_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    statusPublishedAtIdx: index('idx_articles_status_published_at').on(
      table.status,
      table.publishedAt,
    ),
  }),
);

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const articleTags = sqliteTable(
  'article_tags',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.articleId, table.tagId] }),
    tagIdIdx: index('idx_article_tags_tag_id').on(table.tagId),
  }),
);

export const siteSettings = sqliteTable('site_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const images = sqliteTable(
  'images',
  {
    key: text('key').primaryKey(),
    size: integer('size').notNull(),
    width: integer('width'),
    height: integer('height'),
    contentType: text('content_type'),
    uploadedAt: text('uploaded_at').notNull(),
  },
  (table) => ({
    uploadedAtIdx: index('idx_images_uploaded_at').on(table.uploadedAt),
  }),
);

export const articleRevisions = sqliteTable(
  'article_revisions',
  {
    id: text('id').primaryKey(),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    articleCreatedIdx: index('idx_article_revisions_article_created').on(
      table.articleId,
      table.createdAt,
    ),
  }),
);
