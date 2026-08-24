import { queryPublishedArticles } from '~~/server/utils/article';
import { articleListQuerySchema } from '#shared/schemas/article';

export default defineEventHandler(async (event) => {
  const query = validateQuery(event, articleListQuerySchema);

  return queryPublishedArticles(event, {
    limit: query.limit ?? 15,
    offset: query.offset ?? 0,
    tagId: query.tag,
  });
});
