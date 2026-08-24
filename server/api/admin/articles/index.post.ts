import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { articles } from "~~/server/db/schema";
import { serializeAdminArticle } from "~~/server/utils/admin-article";
import { getD1Drizzle } from "~~/server/utils/d1";
import { createArticleBodySchema } from "#shared/schemas/article";

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, createArticleBodySchema);

  const id = body?.id || nanoid(12);

  const db = getD1Drizzle(event);

  const existing = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Article id already exists",
    });
  }

  const now = new Date().toISOString();
  const row = {
    id,
    title: body?.title ?? "",
    content: JSON.stringify(emptyTiptapDoc()),
    plainText: "",
    summary: null,
    charCount: 0,
    eyecatchKey: null,
    eyecatchWidth: null,
    eyecatchHeight: null,
    isNoIndex: false,
    status: "draft" as const,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(articles).values(row);

  return serializeAdminArticle(row, []);
});
