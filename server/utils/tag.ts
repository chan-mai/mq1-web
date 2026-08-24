import { and, asc, count, eq } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { articleTags, articles, tags } from '~~/server/db/schema';
import { getD1Drizzle } from '~~/server/utils/d1';

export const fetchTagById = async (
  event: H3Event,
  tagId?: string | null,
): Promise<Tag | null> => {
  if (!tagId) return null;

  const db = getD1Drizzle(event);
  const rows = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug };
};

export const fetchTagBySlug = async (
  event: H3Event,
  slug?: string | null,
): Promise<Tag | null> => {
  if (!slug) return null;

  const db = getD1Drizzle(event);
  const rows = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug };
};

export const tagExists = async (event: H3Event, tagId?: string | null) => {
  const tag = await fetchTagById(event, tagId);
  return Boolean(tag);
};

export const fetchTag = async (event: H3Event, tagId?: string | null) => {
  const tag = await fetchTagById(event, tagId);
  if (!tag) {
    throw createError({
      statusCode: 404,
      statusMessage: `Tag not found: ${tagId}`,
    });
  }
  return tag;
};

// 公開記事数付きタグ一覧
export const listTagsWithCount = async (event: H3Event): Promise<Tag[]> => {
  const db = getD1Drizzle(event);
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      count: count(articles.id),
    })
    .from(tags)
    .leftJoin(articleTags, eq(articleTags.tagId, tags.id))
    .leftJoin(
      articles,
      and(
        eq(articles.id, articleTags.articleId),
        eq(articles.status, 'published'),
      ),
    )
    .groupBy(tags.id)
    .orderBy(asc(tags.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    count: Number(row.count ?? 0),
  }));
};
