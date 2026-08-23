import { asc, count, eq } from "drizzle-orm";
import { articleTags, tags } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const db = getD1Drizzle(event);

  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
      articleCount: count(articleTags.articleId),
    })
    .from(tags)
    .leftJoin(articleTags, eq(articleTags.tagId, tags.id))
    .groupBy(tags.id)
    .orderBy(asc(tags.name));

  return { tags: rows, totalCount: rows.length };
});
