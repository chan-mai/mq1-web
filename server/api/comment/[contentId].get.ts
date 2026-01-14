export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");

  // クエリパラメータを取得
  const query = getQuery(event);
  let page = parseInt(query.page as string) || 1;
  let limit = parseInt(query.limit as string) || 20;

  // パラメータ検証
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;

  try {
    // 1-3. 独立したクエリを並列実行
    const [overallCount, totalRootCount, rootComments] = await Promise.all([
      // 1. 全承認済みコメント数（表示用）
      prisma.comments.count({
        where: {
          contentId,
          status: "APPROVED",
        },
      }),
      // 2. ルートコメントの総数（ページネーション計算用）
      prisma.comments.count({
        where: {
          contentId,
          status: "APPROVED",
          parentCommentId: null,
        },
      }),
      // 3. ルートコメントの取得（ページネーション適用）
      prisma.comments.findMany({
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
      }),
    ]);

    const totalPages = Math.ceil(totalRootCount / limit);

    // 4. ルートコメント以下の全子孫コメントを再帰的に取得
    const rootCommentIds = rootComments.map((c) => c.id);
    const allDescendants: CommentWithReplies[] = [];
    let currentParentIds = [...rootCommentIds];
    
    // どのコメントがどのルートに属するかを追跡するマップ (CommentID -> RootID)
    const rootIdMap = new Map<string, string>();
    rootComments.forEach(c => rootIdMap.set(c.id, c.id));

    // 再帰的に取得
    while (currentParentIds.length > 0) {
      const nextLevelComments = await prisma.comments.findMany({
        where: {
          contentId,
          status: "APPROVED",
          parentCommentId: {
            in: currentParentIds,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (nextLevelComments.length === 0) {
        break;
      }

      // 取得したコメントのルートIDを特定し、マップに登録
      nextLevelComments.forEach(c => {
        if (c.parentCommentId && rootIdMap.has(c.parentCommentId)) {
          const rootId = rootIdMap.get(c.parentCommentId)!;
          rootIdMap.set(c.id, rootId);
        }
      });

      allDescendants.push(...(nextLevelComments as CommentWithReplies[]));
      currentParentIds = nextLevelComments.map(c => c.id);
    }

    // 5. メモリ上で結合 (フラット構造)
    const commentMap = new Map<string, CommentWithReplies>();
    
    // ルートコメントをマップに登録
    const resultComments: CommentWithReplies[] = rootComments.map(c => ({
      ...c,
      replies: []
    }));

    resultComments.forEach(c => commentMap.set(c.id, c));

    // 全子孫コメントをそれぞれのルートの replies に追加
    allDescendants.forEach(c => {
      // 親(ルート)を特定
      if (rootIdMap.has(c.id)) {
        const rootId = rootIdMap.get(c.id)!;
        if (commentMap.has(rootId)) {
          const root = commentMap.get(rootId)!;
          // 再帰構造ではなくフラットなリストとして追加
          root.replies?.push({
            ...c,
            replies: [] 
          } as CommentWithReplies);
        }
      }
    });
    
    // 返信を日付順にソート (念のため)
    resultComments.forEach(root => {
      if (root.replies) {
        root.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch comments:", errorMessage);
    
    return {
      status: "error",
      message: "Failed to fetch comments",
    };
  }
});

