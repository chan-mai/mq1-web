import { eq } from 'drizzle-orm';
import { tags } from '~~/server/db/schema';
import { getD1Drizzle } from '~~/server/utils/d1';
import { tagIdParamsSchema } from '#shared/schemas/tag';

export default defineEventHandler(async (event) => {
  const { id } = validateParams(event, tagIdParamsSchema);

  const db = getD1Drizzle(event);
  const rows = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.id, id))
    .limit(1);
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' });
  }

  await db.delete(tags).where(eq(tags.id, id));
  return { status: 'success' };
});
