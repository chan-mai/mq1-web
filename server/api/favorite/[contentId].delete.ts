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

  // クエリパラメータからいいねのIDを取得
  const query = getQuery(event);
  const favoriteId = query.id as string;

  if (!favoriteId) {
    return {
      status: "error",
      message: "Favorite ID is required",
      userIp,
    };
  }

  try {
    // まず該当のいいねが存在するか確認
    const existingFavorite = await prisma.favorites.findFirst({
      where: {
        id: favoriteId,
        contentId,
      },
    });

    if (!existingFavorite) {
      return {
        status: "error",
        message: "Favorite not found",
        userIp,
      };
    }

    // いいねを削除
    const favorite = await prisma.favorites.delete({
      where: {
        id: favoriteId,
      },
    });

    return {
      status: "success",
      favoriteId,
      userIp,
      favorite,
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to delete favorite",
      favoriteId,
      userIp,
    };
  }
});
