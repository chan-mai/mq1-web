import { verifySecret } from "~~/server/utils/hashing";
import { and, eq } from "drizzle-orm";
import { articleLikes } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");
  const userIp = getHeader(event, "x-forwarded-for");
  let requestLikeId: string | undefined;

  if (!contentId) {
    return {
      status: "error",
      message: "Content ID is required",
      userIp,
    };
  }

  try {
    // NOTE: Nitro(v2.13)のrequestHasBodyはPOST/PUT/PATCHのみ真を返すため、Workers上ではDELETEのBodyがh3のreadBodyまで届かず、`await readBody(event)`が解決されないPromiseのまま死ぬ
    const cfRequest = (event.context as any)?.cloudflare?.request as Request | undefined;
    const body = cfRequest
      ? await cfRequest.clone().json().catch(() => ({}))
      : ((await readBody(event)) || {});
    const { id, secret } = body as { id?: string; secret?: string };
    requestLikeId = id;
    if (!id || !secret || typeof id !== "string" || typeof secret !== "string") {
      return {
        status: "error",
        message: "Like ID and secret are required and must be strings",
        userIp,
      };
    }

    const db = getD1Drizzle(event);

    // まず該当のいいねが存在するか確認
    const existingLikeRows = await db
      .select({
        id: articleLikes.id,
        contentId: articleLikes.contentId,
        secret: articleLikes.secret,
      })
      .from(articleLikes)
      .where(
        and(eq(articleLikes.id, id), eq(articleLikes.contentId, contentId)),
      )
      .limit(1);
    const existingLike = existingLikeRows[0];

    if (!existingLike) {
      return {
        status: "error",
        message: "Like not found",
        userIp,
      };
    }

    // シークレットを検証
    if (!existingLike.secret || !(await verifySecret(secret, existingLike.secret))) {
        return {
            status: "error",
            message: "Invalid secret",
            id,
            userIp,
        };
    }

    // いいねを削除
    await db
      .delete(articleLikes)
      .where(and(eq(articleLikes.id, id), eq(articleLikes.contentId, contentId)));

    return {
      status: "success",
      id,
      userIp
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to delete like",
      id: requestLikeId,
      userIp,
    };
  }
});
