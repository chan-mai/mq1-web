import { articleExists } from "~~/server/utils/article";
import { verifySecret } from "~~/server/utils/hashing";

export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");
  const userIp = getHeader(event, "x-forwarded-for");
  
  if (!contentId) {
    return {
      status: "error",
      message: "Content ID is required",
      userIp,
    };
  }

  const body = await readBody(event) || {};
  const { id, secret } = body;

  if (!id || !secret) {
    throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Like ID and secret are required",
    });
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
    // まず該当のいいねが存在するか確認
    const existingLike = await prisma.articleLike.findFirst({
      where: {
        id,
        contentId,
      },
    });

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
        };
    }

    // いいねを削除
    await prisma.articleLike.delete({
      where: {
        id,
      },
    });

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
      id,
      userIp,
    };
  }
});
