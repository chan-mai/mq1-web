import { createClient } from "microcms-js-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default defineEventHandler(async (event) => {
  const contentId = event.context.params?.contentId;

  const config = useRuntimeConfig();
  const client = createClient({
    serviceDomain: config.public.microcms.serviceDomain,
    apiKey: config.public.microcms.apiKey,
  });

  // 前後の記事を取得する場合でも必要になるのでとりあえず取得しておく
  const res: any = await client.get({
    endpoint: "articles",
    queries: {
      limit: 1,
      orders: "-publishedAt",
      filters: `id[equals]${contentId}`,
    },
  });
  if (res.contents.length === 0) {
    setResponseStatus(event, 404);
    return {
      statusCode: 404,
      body: "Not Found",
    };
  }
  const article: Article = res.contents[0];

  try {
    // Geminiで要約を生成
    const gemini = new GoogleGenerativeAI(config.geminiApiKey);
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a writer. Please summarize the following article in an interesting and concise manner. The summary should be based on the Japanese text, in plain text only, and approximately 150 characters in length.\n\n--\n\n${article.content}`;

    const response = await model.generateContent(prompt);
    let summary = response.response.text();

    // 生成できなかった場合
    if (!summary) {
      summary = article.content!.slice(0, 50);
    } else {
      summary = summary + "(LLMによる要約)";
    }

    return {
      statusCode: 200,
      body: summary,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: article.content!.slice(0, 50),
    };
  }
});
