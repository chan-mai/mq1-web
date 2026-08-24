import { and, desc, eq, gt, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import { articleTags, articles, tags } from "~~/server/db/schema";
import { serializePublicArticle } from "~~/server/utils/article";
import { fetchTagsForArticles } from "~~/server/utils/admin-article";
import { getD1Drizzle } from "~~/server/utils/d1";
import { searchQuerySchema } from "#shared/schemas/search";

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export default defineEventHandler(async (event) => {
  const query = validateQuery(event, searchQuerySchema);
  const q = query.q ?? "";
  const tagSlugs = query.tags ?? [];
  const { since, until } = query;

  if (!q && tagSlugs.length === 0 && !since && !until) {
    return { contents: [], totalCount: 0 };
  }

  const db = getD1Drizzle(event);
  const conditions: SQL[] = [eq(articles.status, "published")];

  // タグはAND条件
  for (const slug of tagSlugs) {
    const tagRows = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);
    const tagId = tagRows[0]?.id;
    if (!tagId) {
      return { contents: [], totalCount: 0 };
    }
    conditions.push(
      inArray(
        articles.id,
        db
          .select({ articleId: articleTags.articleId })
          .from(articleTags)
          .where(eq(articleTags.tagId, tagId)),
      ),
    );
  }

  if (since) {
    conditions.push(gt(articles.publishedAt, new Date(since).toISOString()));
  }
  if (until) {
    conditions.push(lt(articles.publishedAt, new Date(until).toISOString()));
  }

  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    conditions.push(
      or(
        sql`${articles.title} LIKE ${pattern} ESCAPE '\\'`,
        sql`${articles.plainText} LIKE ${pattern} ESCAPE '\\'`,
      )!,
    );
  }

  const rows = await db
    .select()
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.publishedAt))
    .limit(10);

  const tagMap = await fetchTagsForArticles(
    db,
    rows.map((row) => row.id),
  );

  return {
    contents: rows.map((row) =>
      serializePublicArticle(row, tagMap.get(row.id) ?? []),
    ),
    totalCount: rows.length,
  };
});
