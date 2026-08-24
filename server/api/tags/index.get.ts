import { desc } from 'drizzle-orm';
import { tags } from '~~/server/db/schema';
import { getD1Drizzle } from '~~/server/utils/d1';

export default defineEventHandler(async (event) => {
  const db = getD1Drizzle(event);
  const rows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(tags)
    .orderBy(desc(tags.createdAt));

  return { contents: rows, totalCount: rows.length };
});
