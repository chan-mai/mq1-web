// 管理者用：全コメント一覧取得（ステータス別）
export default defineEventHandler(async (event) => {
  // BASIC認証チェック
  requireBasicAuth(event);

  const query = getQuery(event);
  const status = query.status as string | undefined;
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 50;
  const offset = (page - 1) * limit;

  // ステータスのバリデーション
  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  const whereClause: any = {};
  
  if (status && validStatuses.includes(status)) {
    whereClause.status = status;
  }

  try {
    // コメントを取得
    const comments = await prisma.comments.findMany({
      where: whereClause,
      select: {
        id: true,
        contentId: true,
        name: true,
        comment: true,
        userIp: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    // コメントの総数を取得
    const totalCount = await prisma.comments.count({
      where: whereClause,
    });

    // ステータス別の件数を取得
    const statusCounts = await Promise.all(
      validStatuses.map(async (s) => ({
        status: s,
        count: await prisma.comments.count({ where: { status: s } }),
      }))
    );

    return {
      status: "success",
      comments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      statusCounts,
    }
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return {
      status: "error",
      message: "Failed to fetch comments",
    }
  }
});

