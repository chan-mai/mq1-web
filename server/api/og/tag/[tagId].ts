import { tagOgParamsSchema } from '#shared/schemas/tag';

export default defineEventHandler(async (event) => {
  const { tagId } = validateParams(event, tagOgParamsSchema);

  try {
    const tag = await fetchTag(event, tagId);
    return await renderOgImageResponse(event, `「#${tag.name}」が含まれる記事`);
  } catch (e) {
    console.error(e);
    const err = e as { statusCode?: number; statusMessage?: string };
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Internal Server Error',
    });
  }
});
