import { createClient } from "microcms-js-sdk";

export default defineEventHandler(async (event) => {
  const tagId = event.context.params?.tagId;

  const config = useRuntimeConfig();
  const client = createClient({
    serviceDomain: config.serviceDomain,
    apiKey: config.apiKey,
  });

  const queries = {
    limit: 1,
    orders: "-publishedAt",
    filters: `id[equals]${tagId}`,
  };

  const res: any = await client.get({
    endpoint: "tags",
    queries: queries,
  });
  if (res.contents.length === 0) {
    setResponseStatus(event, 404);
    return {
      statusCode: 404,
      body: "Not Found",
    };
  }
  const response: Tag = res.contents[0];

  return {
    statusCode: 200,
    body: response,
  };
});
