import { tagOgParamsSchema } from "#shared/schemas/tag";

export default defineEventHandler(async (event) => {
  const { tagId } = validateParams(event, tagOgParamsSchema);

  try {
    const tag = await fetchTag(event, tagId);
    return await renderOgImageResponse(event, `「#${tag.name}」が含まれる記事`);
  } catch (e: any) {
    console.error(e);
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || "Internal Server Error",
    });
  }
});
