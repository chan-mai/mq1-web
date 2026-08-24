import { count, eq } from "drizzle-orm";
import { articleLikes } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";
import { likeParamsSchema } from "#shared/schemas/like";

export default defineEventHandler(async (event) => {
  const { contentId } = validateParams(event, likeParamsSchema);
  const userIp = getHeader(event, "x-forwarded-for");

  const db = getD1Drizzle(event);

  // likeからcontentIdが一致するものの件数を取得
  const rows = await db
    .select({ count: count(articleLikes.id) })
    .from(articleLikes)
    .where(eq(articleLikes.contentId, contentId))
    .limit(1);
  const likeCount = Number(rows[0]?.count ?? 0);

  return {
    status: "success",
    count: likeCount,
    userIp,
  };
});
