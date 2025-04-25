import { createClient } from "microcms-js-sdk";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const client = createClient({
    serviceDomain: config.serviceDomain,
    apiKey: config.apiKey,
  });

  const res: any = await client.get({
    endpoint: "tags",
    queries: {
      orders: "-publishedAt",
    },
  });
  if (res.contents.length === 0) {
    return {
      statusCode: 404,
      body: "Not Found",
    };
  }
  const tags: Tag[] = res.contents;

  return {
    statusCode: 200,
    body: tags,
  };
});
