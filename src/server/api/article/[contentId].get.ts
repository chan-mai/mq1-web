import { createClient, type MicroCMSQueries } from "microcms-js-sdk";

export default defineEventHandler(async (event) => {
  const contentId = event.context.params?.contentId;
  // クエリパラメータを取得
  const query = getQuery(event);

  const draftKey: string | null = query.draft_key
    ? (query.draft_key as string)
    : null;
  const prev = query.prev ? query.prev : null;
  const next = query.next ? query.next : null;

  const config = useRuntimeConfig();
  const client = createClient({
    serviceDomain: config.serviceDomain,
    apiKey: config.apiKey,
  });

  // 検索クエリの生成
  let queries: MicroCMSQueries = {
    limit: 1,
    orders: "-publishedAt",
    filters: `id[equals]${contentId}`,
  };

  // 下書きキーが指定されている場合は、下書きキーを追加
  if (draftKey) {
    queries.draftKey = draftKey;
  }

  // 前後の記事を取得する場合でも必要になるのでとりあえず取得しておく
  const res: any = await client.get({
    endpoint: "articles",
    queries: queries,
  });
  if (res.contents.length === 0) {
    setResponseStatus(event, 404);
    return {
      statusCode: 404,
      body: "Not Found",
    };
  }
  const currentArticle: Article = res.contents[0];

  // 前後の記事を取得する場合
  if (prev) {
    // 公開日から前の記事を指定
    queries.filters = `publishedAt[less_than]${
      currentArticle.publishedAt ?? currentArticle.createdAt
    }`;
  } else if (next) {
    // 公開日から次の記事を指定
    queries.orders = "publishedAt";
    queries.filters = `publishedAt[greater_than]${
      currentArticle.publishedAt ?? currentArticle.createdAt
    }`;
  }

  let response: Article = currentArticle;

  if (prev || next) {
    // 取得
    const resBb: any = await client.get({
      endpoint: "articles",
      queries: queries,
    });
    if (resBb.contents.length === 0) {
      setResponseStatus(event, 404);
      return {
        statusCode: 404,
        body: "Not Found",
      };
    }
    response = resBb.contents[0];
  }

  // アイキャッチのURLに?fit=scale&w=1500&fm=webpを追加し、画像サイズを制限, フォーマットの指定
  if (response.eyecatch && response.eyecatch.url) {
    let uri = new URL(response.eyecatch.url);
    uri.searchParams.set("fit", "scale");
    uri.searchParams.set("w", "1500");
    uri.searchParams.set("fm", "webp");
    response.eyecatch.url = uri.toString();
  }

  return {
    statusCode: 200,
    body: response,
  };
});
