import { verifySecret } from "~~/server/utils/hashing";
import { and, eq } from "drizzle-orm";
import { articleLikes } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";
import { likeDeleteBodySchema, likeParamsSchema } from "#shared/schemas/like";

export default defineEventHandler(async (event) => {
  const { contentId } = validateParams(event, likeParamsSchema);
  const userIp = getHeader(event, "x-forwarded-for");

  // NOTE: Nitro(v2.13)のrequestHasBodyはPOST/PUT/PATCHのみ真を返すため、Workers上ではDELETEのBodyがh3のreadBodyまで届かず、`await readBody(event)`が解決されないPromiseのまま死ぬ
  const cfRequest = (event.context as any)?.cloudflare?.request as
    | Request
    | undefined;
  const rawBody = cfRequest
    ? await cfRequest
        .clone()
        .json()
        .catch(() => ({}))
    : (await readBody(event)) || {};
  const { id, secret } = parseOrThrow(likeDeleteBodySchema, rawBody);

  const db = getD1Drizzle(event);

  // まず該当のいいねが存在するか確認
  const existingLikeRows = await db
    .select({
      id: articleLikes.id,
      contentId: articleLikes.contentId,
      secret: articleLikes.secret,
    })
    .from(articleLikes)
    .where(and(eq(articleLikes.id, id), eq(articleLikes.contentId, contentId)))
    .limit(1);
  const existingLike = existingLikeRows[0];

  if (!existingLike) {
    throw createError({ statusCode: 404, statusMessage: "Like not found" });
  }

  // シークレットを検証
  if (
    !existingLike.secret ||
    !(await verifySecret(secret, existingLike.secret))
  ) {
    throw createError({ statusCode: 403, statusMessage: "Invalid secret" });
  }

  // いいねを削除
  await db
    .delete(articleLikes)
    .where(and(eq(articleLikes.id, id), eq(articleLikes.contentId, contentId)));

  return {
    status: "success",
    id,
    userIp,
  };
});
