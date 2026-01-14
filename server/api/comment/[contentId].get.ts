export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");

  // クエリパラメータを取得
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;

  try {
    // 1. 全承認済みコメント数（表示用）
    const overallCount = await prisma.comments.count({
      where: {
        contentId,
        status: "APPROVED",
      },
    });

    // 2. ルートコメントの総数（ページネーション計算用）
    const totalRootCount = await prisma.comments.count({
      where: {
        contentId,
        status: "APPROVED",
        parentCommentId: null,
      },
    });

    const totalPages = Math.ceil(totalRootCount / limit);

    // 3. ルートコメントの取得（ページネーション適用）
    const rootComments = await prisma.comments.findMany({
      where: {
        contentId,
        status: "APPROVED",
        parentCommentId: null,
      },
      orderBy: {
        createdAt: "desc", // 新しい順
      },
      skip: offset,
      take: limit,
    });

    // 4. 取得したルートコメントに対する子コメントを取得
    const rootCommentIds = rootComments.map((c) => c.id);
    const childComments = await prisma.comments.findMany({
      where: {
        contentId,
        status: "APPROVED",
        parentCommentId: {
          in: rootCommentIds,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 5. メモリ上で結合
    const commentMap = new Map<string, CommentWithReplies>();
    
    // ルートコメントをマップに登録
    const resultComments: CommentWithReplies[] = rootComments.map(c => ({
      ...c,
      replies: []
    }));

    resultComments.forEach(c => commentMap.set(c.id, c));

    // 子コメントを紐付け
    childComments.forEach(c => {
      // 念のため存在チェック（クエリ条件的に親はあるはずだが）
      if (c.parentCommentId && commentMap.has(c.parentCommentId)) {
        const parent = commentMap.get(c.parentCommentId)!;
        parent.replies?.push({
          ...c,
          replies: [] 
        } as CommentWithReplies);
      }
    });

    return {
      status: "success",
      comments: resultComments,
      overallCount,
      pagination: {
        page,
        limit,
        totalCount: totalRootCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (err) {
    console.error("Failed to fetch comments:", err);
    return {
      status: "error",
      message: "Failed to fetch comments",
    };
  }
});

