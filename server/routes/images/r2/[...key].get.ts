import { getR2Bucket } from '~~/server/utils/r2';
import { imageKeyParamsSchema } from '#shared/schemas/image';

export default defineEventHandler(async (event) => {
  // キー形式不正は存在を示唆しない404
  const { key } = validateParams(event, imageKeyParamsSchema, 404);

  const bucket = getR2Bucket(event);
  const object = await bucket.get(key);
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  const etag = object.httpEtag as string;
  if (getHeader(event, 'if-none-match') === etag) {
    setResponseStatus(event, 304);
    return null;
  }

  setResponseHeaders(event, {
    'Content-Type':
      object.httpMetadata?.contentType ?? 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: etag,
  });

  return object.body;
});
