import { desc, eq } from "drizzle-orm";
import { articleRevisions } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Id is required" });
  }

  const db = getD1Drizzle(event);
  const rows = await db
    .select({
      id: articleRevisions.id,
      title: articleRevisions.title,
      createdAt: articleRevisions.createdAt,
    })
    .from(articleRevisions)
    .where(eq(articleRevisions.articleId, id))
    .orderBy(desc(articleRevisions.createdAt));

  return { revisions: rows };
});
