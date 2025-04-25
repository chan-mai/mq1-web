import { Feed } from "feed";
import { createClient } from "microcms-js-sdk";
import * as cheerio from 'cheerio';

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const siteName = runtimeConfig.public.siteName as string;
  const siteDescription = runtimeConfig.public.siteDescription as string;
  const siteUrl = runtimeConfig.public.siteUrl as string;
  const siteOgpUrl = runtimeConfig.public.siteOgpUrl as string;

  const feed = new Feed({
    title: siteName,
    description: siteDescription,
    id: siteUrl,
    link: siteUrl,
    language: "ja",
    copyright: `All rights reserved ${new Date().getFullYear()}, ${siteName}`,
    image: siteOgpUrl,
  });

  feed.options = {
    title: siteName,
    id: siteUrl,
    link: siteUrl,
    copyright: `All rights reserved ${new Date().getFullYear()}, ${siteName}`,
    description: siteDescription,
  };

  feed.addCategory("blog");

  const client = createClient({
    serviceDomain: runtimeConfig.serviceDomain,
    apiKey: runtimeConfig.apiKey,
  });

  try {
    const res = await client.getList({
      endpoint: "articles",
      queries: {
        orders: "-publishedAt",
      },
    });

    res?.contents.forEach((article: any) => {
      const url = `${siteUrl}entry/${article.id}`;
      const $ = cheerio.load(article.content ?? "");
      const textContent: string = $.text().trim();
      
      const data = {
        title: article.title ?? "No Title",
        id: url,
        link: url,
        description: article.summary ?? textContent,
        content: textContent,
        date: new Date(article.publishedAt),
      };
      
      feed.addItem(data);
    });

    // レスポンスヘッダーを設定
    setResponseHeaders(event, {
      "Content-Type": "application/xml; charset=utf-8"
    });

    // XMLをそのままストリームとして返す
    const xmlContent = feed.rss2();
    return new Response(xmlContent, {
      headers: { "Content-Type": "application/xml; charset=utf-8" }
    });
  } catch (err) {
    console.error(err);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate RSS feed',
    });
  }
});