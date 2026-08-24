import { and, count, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { articleTags, articles } from '~~/server/db/schema';
import {
  eyecatchUrlFromKey,
  fetchTagsForArticles,
  type ArticleRow,
  type TagRow,
} from '~~/server/utils/admin-article';
import { getD1Drizzle } from '~~/server/utils/d1';

export const serializePublicArticle = (
  row: ArticleRow,
  tagRows: TagRow[],
): Article => ({
  id: row.id,
  title: row.title,
  content: parseTiptapDoc(row.content) ?? emptyTiptapDoc(),
  summary: row.summary ?? '',
  charCount: row.charCount,
  eyecatch: row.eyecatchKey
    ? {
        url: eyecatchUrlFromKey(row.eyecatchKey)!,
        width: row.eyecatchWidth,
        height: row.eyecatchHeight,
      }
    : null,
  tags: tagRows.map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
  is_no_index: row.isNoIndex,
  publishedAt: row.publishedAt ?? row.createdAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const withTags = async (
  db: ReturnType<typeof getD1Drizzle>,
  rows: ArticleRow[],
) => {
  const tagMap = await fetchTagsForArticles(
    db,
    rows.map((row) => row.id),
  );
  return rows.map((row) =>
    serializePublicArticle(row, tagMap.get(row.id) ?? []),
  );
};

export interface ArticleQueryOptions {
  limit?: number;
  offset?: number;
  tagId?: string;
  ids?: string[];
}

export const queryPublishedArticles = async (
  event: H3Event,
  options: ArticleQueryOptions = {},
) => {
  const db = getD1Drizzle(event);
  const conditions = [eq(articles.status, 'published')];

  if (options.tagId) {
    conditions.push(
      inArray(
        articles.id,
        db
          .select({ articleId: articleTags.articleId })
          .from(articleTags)
          .where(eq(articleTags.tagId, options.tagId)),
      ),
    );
  }
  if (options.ids) {
    if (options.ids.length === 0) return { contents: [], totalCount: 0 };
    conditions.push(inArray(articles.id, options.ids));
  }

  const where = and(...conditions);

  const totalRows = await db
    .select({ count: count(articles.id) })
    .from(articles)
    .where(where);
  const totalCount = Number(totalRows[0]?.count ?? 0);

  let query = db
    .select()
    .from(articles)
    .where(where)
    .orderBy(desc(articles.publishedAt))
    .$dynamic();
  if (options.limit !== undefined) query = query.limit(options.limit);
  if (options.offset !== undefined) query = query.offset(options.offset);

  const rows = await query;
  return { contents: await withTags(db, rows), totalCount };
};

export const fetchArticleByContentId = async (
  event: H3Event,
  contentId?: string | null,
  options: { includeDraft?: boolean } = {},
): Promise<Article | null> => {
  if (!contentId) return null;

  const db = getD1Drizzle(event);
  const conditions = [eq(articles.id, contentId)];
  if (!options.includeDraft) {
    conditions.push(eq(articles.status, 'published'));
  }

  const rows = await db
    .select()
    .from(articles)
    .where(and(...conditions))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const [serialized] = await withTags(db, [row]);
  return serialized ?? null;
};

export const articleExists = async (
  event: H3Event,
  contentId?: string | null,
) => {
  const article = await fetchArticleByContentId(event, contentId);
  return Boolean(article);
};

export const fetchArticle = async (
  event: H3Event,
  contentId?: string | null,
) => {
  const article = await fetchArticleByContentId(event, contentId);
  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: `Article not found: ${contentId}`,
    });
  }
  return article;
};

export const fetchAdjacentArticles = async (
  event: H3Event,
  publishedAt: string,
) => {
  const db = getD1Drizzle(event);

  const olderRows = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, 'published'),
        lt(articles.publishedAt, publishedAt),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(1);
  const newerRows = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, 'published'),
        gt(articles.publishedAt, publishedAt),
      ),
    )
    .orderBy(sql`${articles.publishedAt} ASC`)
    .limit(1);

  const serialize = async (row?: ArticleRow) => {
    if (!row) return null;
    const [article] = await withTags(db, [row]);
    return article ?? null;
  };

  return {
    older: await serialize(olderRows[0]),
    newer: await serialize(newerRows[0]),
  };
};
