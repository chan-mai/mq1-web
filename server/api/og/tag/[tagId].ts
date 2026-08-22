export default defineEventHandler(async (event) => {
  const tagId = getRouterParam(event, "tagId");
  if (!tagId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Tag ID is required",
    });
  }

  try {
    const tag = await fetchTag(tagId);
    return await renderOgImageResponse(event, `「#${tag.name}」が含まれる記事`);
  } catch (e: any) {
    console.error(e);
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || "Internal Server Error",
    });
  }
});
