import { and, eq, ne } from 'drizzle-orm';
import { tags } from '~~/server/db/schema';
import { getD1Drizzle } from '~~/server/utils/d1';
import { tagIdParamsSchema, tagUpsertBodySchema } from '#shared/schemas/tag';

export default defineEventHandler(async (event) => {
  const { id } = validateParams(event, tagIdParamsSchema);
  const { name, slug } = await validateBody(event, tagUpsertBodySchema);

  const db = getD1Drizzle(event);
  const rows = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' });
  }

  const duplicated = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.slug, slug), ne(tags.id, id)))
    .limit(1);
  if (duplicated.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Tag slug already exists',
    });
  }

  const now = new Date().toISOString();
  await db
    .update(tags)
    .set({ name, slug, updatedAt: now })
    .where(eq(tags.id, id));

  await purgeContentCache();

  return { ...rows[0]!, name, slug, updatedAt: now };
});
