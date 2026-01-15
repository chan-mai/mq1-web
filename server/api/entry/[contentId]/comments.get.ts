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
        include: {
          _count: {
            select: { likes: true },
          },
          likes: {
            select: { id: true },
          },
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
    const allDescendants: any[] = []; // 型定義回避のためにany使用 (Prismaの返り値型は複雑なため)
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
        include: {
          _count: {
            select: { likes: true },
          },
          likes: {
            select: { id: true },
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

      allDescendants.push(...nextLevelComments);
      currentParentIds = nextLevelComments.map(c => c.id);
    }

    // データをマッピングするヘルパー関数
    const mapToCommentWithReplies = (c: any): CommentWithReplies => {
      // Prismaの返り値から必要なプロパティを抽出し、CommentWithReplies型に合わせる
      const { _count, likes, ...rest } = c;
      return {
        ...rest,
        likes: _count?.likes || 0,
        likeIds: likes?.map((l: any) => l.id) || [],
        replies: [],
      };
    };

    // 5. メモリ上で結合 (フラット構造)
    const commentMap = new Map<string, CommentWithReplies>();
    
    // ルートコメントをマップに登録
    const resultComments: CommentWithReplies[] = rootComments.map(mapToCommentWithReplies);

    resultComments.forEach(c => commentMap.set(c.id, c));

    // 全子孫コメントをそれぞれのルートの replies に追加
    allDescendants.forEach(c => {
      // 親(ルート)を特定
      if (rootIdMap.has(c.id)) {
        const rootId = rootIdMap.get(c.id)!;
        if (commentMap.has(rootId)) {
          const root = commentMap.get(rootId)!;
          const descendant = mapToCommentWithReplies(c);
          
          // 再帰構造ではなくフラットなリストとして追加
          root.replies?.push(descendant);
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

