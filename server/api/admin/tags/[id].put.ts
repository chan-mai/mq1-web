import { and, eq, ne } from "drizzle-orm";
import { tags } from "~~/server/db/schema";
import { TAG_SLUG_PATTERN } from "~~/server/utils/admin-article";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Id is required" });
  }

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
  const rows = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  if (rows.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "Tag not found" });
  }

  const duplicated = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.slug, slug), ne(tags.id, id)))
    .limit(1);
  if (duplicated.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Tag slug already exists",
    });
  }

  const now = new Date().toISOString();
  await db
    .update(tags)
    .set({ name, slug, updatedAt: now })
    .where(eq(tags.id, id));

  return { ...rows[0]!, name, slug, updatedAt: now };
});
