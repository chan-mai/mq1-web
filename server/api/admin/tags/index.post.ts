import { eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { tags } from "~~/server/db/schema";
import { TAG_SLUG_PATTERN } from "~~/server/utils/admin-article";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; slug?: string }>(event);

  const name = body?.name?.trim();
  const slug = body?.slug?.trim();
  if (!name || !slug || !TAG_SLUG_PATTERN.test(slug)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid tag name or slug",
    });
  }

  const db = getD1Drizzle(event);
  const id = nanoid(12);

  const existing = await db
    .select({ id: tags.id })
    .from(tags)
    .where(or(eq(tags.id, id), eq(tags.slug, slug)))
    .limit(1);
  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Tag already exists",
    });
  }

  const now = new Date().toISOString();
  const row = { id, name, slug, createdAt: now, updatedAt: now };
  await db.insert(tags).values(row);

  return row;
});
