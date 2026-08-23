import { fetchTagBySlug } from "~~/server/utils/tag";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Slug is required" });
  }

  const tag = await fetchTagBySlug(event, slug);
  if (!tag) {
    throw createError({
      statusCode: 404,
      statusMessage: `Tag not found: ${slug}`,
    });
  }
  return tag;
});
