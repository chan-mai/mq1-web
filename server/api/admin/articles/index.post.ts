import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { articles } from "~~/server/db/schema";
import {
  ARTICLE_ID_PATTERN,
  serializeAdminArticle,
} from "~~/server/utils/admin-article";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id?: string; title?: string }>(event);

  const id = body?.id?.trim() || nanoid(12);
  if (!ARTICLE_ID_PATTERN.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid article id",
    });
  }

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
    title: body?.title?.trim() ?? "",
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
