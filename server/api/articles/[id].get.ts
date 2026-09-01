import { fetchArticleByContentId } from '~~/server/utils/article';
import { articleIdParamsSchema } from '#shared/schemas/article';

// 下書き閲覧は/api/admin/articles/[id]/preview
export default defineCachedEventHandler(
  async (event) => {
    const { id } = validateParams(event, articleIdParamsSchema);

    const article = await fetchArticleByContentId(event, id);
    if (!article) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Article not found',
      });
    }
    return article;
  },
  { name: 'articles-detail', swr: true, maxAge: 3600 },
);
