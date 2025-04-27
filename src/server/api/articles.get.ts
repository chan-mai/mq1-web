import { createClient } from "microcms-js-sdk";

export default defineEventHandler(async (event) => {
  // クエリパラメータを取得
  const query = getQuery(event);
  const limit: number = query.limit ? (query.limit as number) : 5;
  const tagId: string | null = query.tag_id ? (query.tag_id as string) : null;

  const config = useRuntimeConfig();
  const client = createClient({
    serviceDomain: config.serviceDomain,
    apiKey: config.apiKey,
  });

  // 検索クエリの生成
  let queries: any = {
    limit: limit,
    orders: "-publishedAt",
  };

  // 検索条件にタグがあれば追加
  if (tagId) {
    queries.filters = `tags[contains]${tagId}`;
  }

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
  const response: Article[] = res.contents;

  // アイキャッチのURLに?fit=scale&w=250を追加し、画像サイズを制限
  response.forEach((article) => {
    if (article.eyecatch) {
      let uri = new URL(article.eyecatch.url);
      uri.searchParams.set("fit", "scale");
      uri.searchParams.set("w", "250");
      article.eyecatch.url = uri.toString();
    }
  });

  return {
    statusCode: 200,
    body: response,
  };
});
