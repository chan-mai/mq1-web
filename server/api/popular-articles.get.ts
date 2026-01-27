import { createClient } from "microcms-js-sdk";
import type { MicroCMSObject } from "#shared/types/microccms";

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const serviceDomain = config.public.microcms.serviceDomain;
    const apiKey = config.public.microcms.apiKey;
    const excludeId = getQuery(event).excludeId as string | undefined;

    if (!serviceDomain || !apiKey) {
      throw new Error("MicroCMS credentials are not set.");
    }

    const client = createClient({
      serviceDomain,
      apiKey,
    });

    const limit = 5;
    // 直近30日間のいいねを集計
    const since = new Date();
    since.setDate(since.getDate() - 30);

    // 人気記事ID取得
    const topArticles = await prisma.articleLike.groupBy({
      by: ['contentId'],
      _count: {
        contentId: true,
      },
      where: {
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        _count: {
          contentId: 'desc',
        },
      },
      take: limit,
    });

    let articles: (MicroCMSObject<Article> & { likeCount: number })[] = [];

    //  記事取得
    if (topArticles.length > 0) {
        const ids = topArticles.map(t => t.contentId);
        const response = await client.getList<MicroCMSObject<Article>>({
            endpoint: 'articles',
            queries: {
                ids: ids.join(','), // filters: `id[in]...` の代わりに ids パラメータを使用可能 (SDK仕様によるが基本はids推奨) 
                // または filters: `id[in]${ids.join(',')}`
            }
        });
        
        // ID順（人気順）に並べ替え & いいね数結合
         articles = ids.map((id) => {
            const article = response.contents.find(c => c.id === id);
            if (!article) return null;
            const meta = topArticles.find(p => p.contentId === id);
            return {
                ...article,
                likeCount: meta?._count.contentId || 0
            };
        }).filter((item): item is (MicroCMSObject<Article> & { likeCount: number }) => item !== null);
    }

    // 不足分を最新記事で埋める (ターゲット数: 3 + 除外分余裕)
    // 実際に返すのは3件だが、除外IDが上位に含まれる可能性があるため多めに確保
    const targetCount = 3;
    if (articles.length < targetCount + 1) {
        const currentIds = articles.map(a => a.id);
        if(excludeId && !currentIds.includes(excludeId)) currentIds.push(excludeId);

        const fallbackLimit = 5;
        const fallback = await client.getList<MicroCMSObject<Article>>({
            endpoint: 'articles',
            queries: {
                limit: fallbackLimit,
                orders: '-publishedAt',
            }
        });

        const fillers = fallback.contents
            .filter(a => !currentIds.includes(a.id))
            .map(a => ({ ...a, likeCount: 0 }));

        articles = [...articles, ...fillers];
    }

    // 除外IDをフィルタリング
    if (excludeId) {
        articles = articles.filter(a => a.id !== excludeId);
    }

    return {
      status: 'success',
      articles: articles.slice(0, 3),
    };

  } catch (error) {
    console.error('Failed to fetch popular articles:', error);
    return {
      status: 'error',
      articles: [],
    };
  }
});
