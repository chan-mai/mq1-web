import { inArray } from 'drizzle-orm';
import { articles, siteSettings } from '~~/server/db/schema';
import { getD1Drizzle } from '~~/server/utils/d1';
import { settingsPutBodySchema } from '#shared/schemas/settings';

export default defineEventHandler(async (event) => {
  const { pinnedArticleIds } = await validateBody(event, settingsPutBodySchema);

  const uniqueIds = [...new Set(pinnedArticleIds)];
  const db = getD1Drizzle(event);

  if (uniqueIds.length > 0) {
    const found = await db
      .select({ id: articles.id })
      .from(articles)
      .where(inArray(articles.id, uniqueIds));
    if (found.length !== uniqueIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unknown article id',
      });
    }
  }

  const value = JSON.stringify(uniqueIds);
  await db
    .insert(siteSettings)
    .values({ key: 'pinned_article_ids', value })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value },
    });

  return { pinnedArticleIds: uniqueIds };
});
