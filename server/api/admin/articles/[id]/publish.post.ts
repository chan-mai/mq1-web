import { eq } from 'drizzle-orm';
import { articles } from '~~/server/db/schema';
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
  const article = rows[0];
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' });
  }

  const now = new Date().toISOString();
  await db
    .update(articles)
    .set({
      status: 'published',
      // 初回公開時のみ設定
      publishedAt: article.publishedAt ?? now,
      updatedAt: now,
    })
    .where(eq(articles.id, id));

  await purgeContentCache();

  return { status: 'success', publishedAt: article.publishedAt ?? now };
});
