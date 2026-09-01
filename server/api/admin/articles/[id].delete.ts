import { eq } from 'drizzle-orm';
import { articles } from '~~/server/db/schema';
import { getD1Drizzle } from '~~/server/utils/d1';
import { articleIdParamsSchema } from '#shared/schemas/article';

export default defineEventHandler(async (event) => {
  const { id } = validateParams(event, articleIdParamsSchema);

  const db = getD1Drizzle(event);
  const rows = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' });
  }

  await db.delete(articles).where(eq(articles.id, id));

  await purgeContentCache();

  return { status: 'success' };
});
