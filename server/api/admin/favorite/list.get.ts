export default defineEventHandler(async (event) => {
  // 認証チェック
  const { user } = await getUserSession(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "認証が必要です",
    });
  }

  // クエリパラメータを取得
  const query = getQuery(event);
  const page = parseInt((query.page as string) || "1", 10);
  const limit = parseInt((query.limit as string) || "20", 10);
  const contentId = query.contentId as string | undefined;
  const userIp = query.userIp as string | undefined;

  try {
    // フィルター条件を構築
    const where: any = {};
    if (contentId) {
      where.contentId = contentId;
    }
    if (userIp) {
      where.userIp = userIp;
    }

    // 総数を取得
    const totalCount = await prisma.favorites.count({ where });

    // ページネーション計算
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // いいね一覧を取得
    const favorites = await prisma.favorites.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // contentId別の集計情報を取得
    const contentIdCounts = await prisma.favorites.groupBy({
      by: ["contentId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // 統計情報を取得
    const statistics = {
      totalFavorites: await prisma.favorites.count(),
      uniqueUsers: await prisma.favorites.groupBy({
        by: ["userIp"],
      }).then((result) => result.length),
      uniqueArticles: await prisma.favorites.groupBy({
        by: ["contentId"],
      }).then((result) => result.length),
    };

    return {
      status: "success",
      favorites,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      contentIdCounts: contentIdCounts.map((item) => ({
        contentId: item.contentId,
        count: item._count.id,
      })),
      statistics,
    };
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "いいね一覧の取得に失敗しました",
    });
  }
});
