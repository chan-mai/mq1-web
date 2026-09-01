import { fetchArticleByContentId } from '~~/server/utils/article';
import { articleIdParamsSchema } from '#shared/schemas/article';

// 下書き含む記事取得(認証はadmin-auth middleware)
export default defineEventHandler(async (event) => {
  const { id } = validateParams(event, articleIdParamsSchema);

  const article = await fetchArticleByContentId(event, id, {
    includeDraft: true,
  });
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' });
  }
  return article;
});
