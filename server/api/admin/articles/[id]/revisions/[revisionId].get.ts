import { and, eq } from "drizzle-orm";
import { articleRevisions } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const revisionId = getRouterParam(event, "revisionId");
  if (!id || !revisionId) {
    throw createError({ statusCode: 400, statusMessage: "Id is required" });
  }

  const db = getD1Drizzle(event);
  const rows = await db
    .select()
    .from(articleRevisions)
    .where(
      and(
        eq(articleRevisions.articleId, id),
        eq(articleRevisions.id, revisionId),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Revision not found" });
  }

  return {
    id: row.id,
    title: row.title,
    content: parseTiptapDoc(row.content) ?? emptyTiptapDoc(),
    createdAt: row.createdAt,
  };
});
