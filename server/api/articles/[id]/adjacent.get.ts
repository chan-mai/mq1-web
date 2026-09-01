import {
  fetchAdjacentArticles,
  fetchArticleByContentId,
} from '~~/server/utils/article';
import { articleIdParamsSchema } from '#shared/schemas/article';

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

    return fetchAdjacentArticles(event, article.publishedAt);
  },
  { name: 'articles-adjacent', swr: true, maxAge: 3600 },
);
