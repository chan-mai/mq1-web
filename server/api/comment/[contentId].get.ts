export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");

  // クエリパラメータを取得
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;

  try {
    // 承認済みコメントを取得（新しい順）
    const comments = await prisma.comments.findMany({
      where: {
        contentId,
        status: "APPROVED",
      },
      select: {
        id: true,
        name: true,
        comment: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    // 承認済みコメントの総数を取得
    const totalCount = await prisma.comments.count({
      where: {
        contentId,
        status: "APPROVED",
      },
    });

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
    }
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return {
      status: "error",
      message: "Failed to fetch comments",
    }
  }
});

