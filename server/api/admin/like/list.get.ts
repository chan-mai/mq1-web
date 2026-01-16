import { requirePermission, Permission } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  // LIKE_VIEW権限チェック
  await requirePermission(event, Permission.LIKE_VIEW);

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
    const totalCount = await prisma.articleLike.count({ where });
    const likes = await prisma.articleLike.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 統計情報の取得（全体の簡易集計）
    // note: 本格的な統計は別途専用APIを作ると良い
    const contentIdCounts = await prisma.articleLike.groupBy({
      by: ['contentId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const statistics = {
      totalLikes: await prisma.articleLike.count(),
      uniqueUsers: await prisma.articleLike.groupBy({
        by: ['userIp'],
      }).then(r => r.length),
      uniqueArticles: await prisma.articleLike.groupBy({
        by: ['contentId'],
      }).then(r => r.length),
    };

    return {
      status: "success",
      likes,
      totalCount,
      page,
      limit,
      statistics,
      contentIdCounts: contentIdCounts.map((item) => ({
        contentId: item.contentId,
        count: item._count.id,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch likes:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "いいね一覧の取得に失敗しました",
    });
  }
});
