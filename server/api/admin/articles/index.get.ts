import { desc } from 'drizzle-orm';
import { articles } from '~~/server/db/schema';
import {
  fetchTagsForArticles,
  serializeAdminArticle,
} from '~~/server/utils/admin-article';
import { getD1Drizzle } from '~~/server/utils/d1';

export default defineEventHandler(async (event) => {
  const db = getD1Drizzle(event);

  const rows = await db
    .select()
    .from(articles)
    .orderBy(desc(articles.updatedAt));

  const tagMap = await fetchTagsForArticles(
    db,
    rows.map((row) => row.id),
  );

  return {
    articles: rows.map((row) =>
      serializeAdminArticle(row, tagMap.get(row.id) ?? []),
    ),
    totalCount: rows.length,
  };
});
