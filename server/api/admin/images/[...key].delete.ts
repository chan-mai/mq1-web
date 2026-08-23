import { eq, or, sql } from "drizzle-orm";
import { articles, images } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";
import { getR2Bucket } from "~~/server/utils/r2";

const KEY_PATTERN = /^[a-zA-Z0-9/_-]+\.[a-z0-9]+$/;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key");
  if (!key || key.includes("..") || !KEY_PATTERN.test(key)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid key" });
  }

  // 参照のある画像を除外
  const db = getD1Drizzle(event);
  const pattern = `%/images/r2/${escapeLike(key)}%`;
  const used = await db
    .select({ id: articles.id, title: articles.title })
    .from(articles)
    .where(
      or(
        sql`${articles.content} LIKE ${pattern} ESCAPE '\\'`,
        eq(articles.eyecatchKey, key),
      ),
    )
    .limit(5);

  if (used.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Image is in use",
      data: { articles: used },
    });
  }

  await getR2Bucket(event).delete(key);
  await db.delete(images).where(eq(images.key, key));
  return { status: "success" };
});
