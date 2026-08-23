import { eq, or, sql } from "drizzle-orm";
import { articles, images } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";

const KEY_PATTERN = /^[a-zA-Z0-9/_-]+\.[a-z0-9]+$/;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key");
  if (!key || key.includes("..") || !KEY_PATTERN.test(key)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid key" });
  }

  const db = getD1Drizzle(event);
  const rows = await db
    .select()
    .from(images)
    .where(eq(images.key, key))
    .limit(1);
  const image = rows[0];
  if (!image) {
    throw createError({ statusCode: 404, statusMessage: "Image not found" });
  }

  // 参照している記事
  const pattern = `%/images/r2/${escapeLike(key)}%`;
  const usedBy = await db
    .select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
    })
    .from(articles)
    .where(
      or(
        sql`${articles.content} LIKE ${pattern} ESCAPE '\\'`,
        eq(articles.eyecatchKey, key),
      ),
    )
    .limit(20);

  return {
    key,
    url: `/images/r2/${key}`,
    size: image.size,
    width: image.width,
    height: image.height,
    uploaded: image.uploadedAt,
    contentType: image.contentType,
    usedBy,
  };
});
