export default defineEventHandler(async (event) => {
  const contentId = getRouterParam(event, "contentId");
  if (!contentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Content ID is required",
    });
  }

  try {
    const article = await fetchArticle(contentId);
    if (!article) {
      throw createError({
        statusCode: 404,
        statusMessage: "Article not found",
      });
    }

    // eyecatchがあればそれをレスポンス
    if (article.eyecatch) {
      // Twitter用にPNG形式を使用（TwitterクローラーのWebP互換性問題を回避）
      const imageUrl = new URL(article.eyecatch.url);
      imageUrl.searchParams.set("fm", "png");

      const imageResponse = await fetch(imageUrl.toString());
      if (!imageResponse.ok) {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to fetch OG image",
        });
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      setHeader(event, "Content-Type", "image/png");
      setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");
      return buffer;
    }

    return await renderOgImageResponse(event, article.title);
  } catch (e: any) {
    console.error(e);
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || "Internal Server Error",
    });
  }
});
