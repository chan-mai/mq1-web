import { getR2Bucket } from '~~/server/utils/r2';
import { contentIdParamsSchema } from '#shared/schemas/article';

const R2_URL_PREFIX = '/images/r2/';

export default defineEventHandler(async (event) => {
  const { contentId } = validateParams(event, contentIdParamsSchema);

  try {
    const article = await fetchArticle(event, contentId);
    if (!article) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Article not found',
      });
    }

    // eyecatchがあればR2から取得してレスポンス
    if (article.eyecatch?.url?.startsWith(R2_URL_PREFIX)) {
      const key = article.eyecatch.url.slice(R2_URL_PREFIX.length);
      const object = await getR2Bucket(event).get(key);
      if (!object) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to fetch OG image',
        });
      }
      const buffer = Buffer.from(await object.arrayBuffer());
      setHeader(
        event,
        'Content-Type',
        object.httpMetadata?.contentType ?? 'image/png',
      );
      setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
      return buffer;
    }

    return await renderOgImageResponse(event, article.title);
  } catch (e) {
    console.error(e);
    const err = e as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal Server Error',
    });
  }
});
