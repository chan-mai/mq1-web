import { articleExists } from "../../utils/article";

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

  const exists = await articleExists(contentId);
  if (!exists) {
    return {
      status: "error",
      message: "Article not found",
      userIp,
    };
  }

  try {
    // いいねの新規作成
    // NOTE: MAP-E環境で同一IP扱いになることがあるらしいので、IPのユニーク制約を削除した(VercelがIPv6をサポートしないのが悪い)
    const favorite = await prisma.favorites.create({
      data: {
        contentId,
        userIp,
      },
    });
    return {
      status: "success",
      favorite,
      userIp,
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to create favorite",
      userIp,
    };
  }
});
