import { eq } from 'drizzle-orm';
import { articles } from '~~/server/db/schema';
import {
  fetchTagsForArticles,
  serializeAdminArticle,
} from '~~/server/utils/admin-article';
import { getD1Drizzle } from '~~/server/utils/d1';
import { articleIdParamsSchema } from '#shared/schemas/article';

export default defineEventHandler(async (event) => {
  const { id } = validateParams(event, articleIdParamsSchema);

  const db = getD1Drizzle(event);
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' });
  }

  const tagMap = await fetchTagsForArticles(db, [row.id]);
  return serializeAdminArticle(row, tagMap.get(row.id) ?? []);
});
