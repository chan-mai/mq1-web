import { Feed } from "feed";
import { queryPublishedArticles } from "~~/server/utils/article";

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event);
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

  try {
    const { contents } = await queryPublishedArticles(event);

    for (const article of contents) {
      const url = `${siteUrl}entry/${article.id}`;
      const excerpt =
        article.summary.slice(0, 100) +
        (article.summary.length > 100 ? "…" : "");

      feed.addItem({
        title: article.title || "No Title",
        id: url,
        link: url,
        description: excerpt,
        content: excerpt,
        date: new Date(article.publishedAt),
      });
    }

    setResponseHeaders(event, {
      "Content-Type": "application/xml; charset=utf-8",
    });

    const xmlContent = feed.rss2();
    return new Response(xmlContent, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (err) {
    console.error(err);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate RSS feed",
    });
  }
});
