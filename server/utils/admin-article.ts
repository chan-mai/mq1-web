import { asc, eq, inArray } from 'drizzle-orm';
import { articleTags, articles, tags } from '~~/server/db/schema';
import { getD1Drizzle } from '~~/server/utils/d1';

export type ArticleRow = typeof articles.$inferSelect;
export type TagRow = typeof tags.$inferSelect;

export const eyecatchUrlFromKey = (key: string | null) =>
  key ? `/images/r2/${key}` : null;

export const serializeAdminArticle = (row: ArticleRow, tagRows: TagRow[]) => ({
  id: row.id,
  title: row.title,
  content: parseTiptapDoc(row.content) ?? emptyTiptapDoc(),
  summary: row.summary,
  charCount: row.charCount,
  eyecatch: row.eyecatchKey
    ? {
        key: row.eyecatchKey,
        url: eyecatchUrlFromKey(row.eyecatchKey),
        width: row.eyecatchWidth,
        height: row.eyecatchHeight,
      }
    : null,
  isNoIndex: row.isNoIndex,
  status: row.status,
  publishedAt: row.publishedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  tags: tagRows.map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
});

export const fetchTagsForArticles = async (
  db: ReturnType<typeof getD1Drizzle>,
  articleIds: string[],
) => {
  const map = new Map<string, TagRow[]>();
  if (articleIds.length === 0) return map;

  const rows = await db
    .select({
      articleId: articleTags.articleId,
      tag: tags,
    })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(inArray(articleTags.articleId, articleIds))
    .orderBy(asc(articleTags.position));

  for (const row of rows) {
    const list = map.get(row.articleId) ?? [];
    list.push(row.tag);
    map.set(row.articleId, list);
  }
  return map;
};

export const replaceArticleTags = async (
  db: ReturnType<typeof getD1Drizzle>,
  articleId: string,
  tagIds: string[],
) => {
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
  if (tagIds.length === 0) return;

  await db.insert(articleTags).values(
    tagIds.map((tagId, position) => ({
      articleId,
      tagId,
      position,
    })),
  );
};
