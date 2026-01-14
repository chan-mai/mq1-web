export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");

  // クエリパラメータを取得
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const offset = (page - 1) * limit;

  try {
    // 全ての承認済みコメントを取得ƒ
    const allComments = await prisma.comments.findMany({
      where: {
        contentId,
        status: "APPROVED",
      },
      orderBy: {
        createdAt: "asc", // 作成順に取得してツリー構築しやすくする
      },
    });

    // コメントをIDをキーにしたマップに変換
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // まず全てのコメントをマップに登録し、replies配列を初期化
    allComments.forEach((c) => {
      const comment = { ...c, replies: [] } as CommentWithReplies;
      commentMap.set(c.id, comment);
    });

    // 親子関係を構築
    allComments.forEach((c) => {
      const comment = commentMap.get(c.id)!;
      if (c.parentCommentId && commentMap.has(c.parentCommentId)) {
        const parent = commentMap.get(c.parentCommentId)!;
        parent.replies?.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    // ルートコメントを新しい順（降順）にソート
    rootComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // ページネーション適用
    const totalCount = rootComments.length;
    const overallCount = allComments.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedComments = rootComments.slice(offset, offset + limit);

    return {
      status: "success",
      comments: paginatedComments,
      overallCount,
      pagination: {
        page,
        limit,
        totalCount,
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

