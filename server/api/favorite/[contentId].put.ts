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
    // favoritesにcontentIdとuserIpが一致するものが存在するか確認
    const existingFavorite = await prisma.favorites.findFirst({
      where: {
        contentId,
        userIp,
      },
    });
    if (existingFavorite) {
      return {
        status: "error",
        message: "Favorite already exists",
        userIp,
      };
    } else {
      // favoritesにcontentIdとuserIpが一致するものが存在しない場合は新規作成
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
    }
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to create favorite",
      userIp,
    };
  }
});
