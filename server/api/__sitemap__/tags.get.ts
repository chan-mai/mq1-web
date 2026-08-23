import { listTagsWithCount } from "~~/server/utils/tag";

export default defineEventHandler(async (event) => {
  const tags = await listTagsWithCount(event);
  return tags
    .filter((tag) => (tag.count ?? 0) > 0)
    .map((tag) => ({ loc: `/tag/${tag.slug}` }));
});
