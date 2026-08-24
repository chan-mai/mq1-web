import { queryPublishedArticles } from '~~/server/utils/article';

export default defineEventHandler(async (event) => {
  const { contents } = await queryPublishedArticles(event);
  return contents.map((article) => ({
    loc: `/entry/${article.id}`,
    lastmod: article.updatedAt || article.publishedAt,
    images: [
      {
        loc:
          article.eyecatch?.url ??
          `/api/og/article/${article.id}?v=${OG_IMAGE_RENDERER_VERSION}`,
      },
    ],
  }));
});
