import { articleExists } from "~~/server/utils/article";
import crypto from "node:crypto";
import { hashSecret } from "~~/server/utils/hashing";
import { getClientIP } from "~~/server/utils/ip";
import { getD1Drizzle } from "~~/server/utils/d1";
import { articleLikes } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");
  const userIp = getClientIP(event);

  if (!contentId) {
    return {
      status: "error",
      message: "Content ID is required",
      userIp,
    };
  }

  const exists = await articleExists(contentId);
  if (!exists) {
    return {
      status: "error",
      message: "Article not found",
      userIp,
    };
  }

  try {
    const db = getD1Drizzle(event);

    // シークレットを生成
    const secret = crypto.randomUUID();
    const hashedSecret = await hashSecret(secret);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // いいねの新規作成
    // NOTE: MAP-E環境で同一IP扱いになることがあるらしいので、IPのユニーク制約を削除した(VercelがIPv6をサポートしないのが悪い)
    await db.insert(articleLikes).values({
      id,
      contentId,
      userIp,
      secret: hashedSecret,
      createdAt: now,
      updatedAt: now,
    });

    return {
      status: "success",
      like: {
        id,
        contentId,
        userIp,
        createdAt: now,
        updatedAt: now,
        secret, // クライアント保存用 (平文を返す)
      },
      userIp,
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to create like",
      userIp,
    };
  }
});
