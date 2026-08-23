import { queryPublishedArticles } from "~~/server/utils/article";

const clampNumber = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = clampNumber(query.limit, 15, 50);
  const offset = clampNumber(query.offset, 0, 100000);
  const tagId = typeof query.tag === "string" ? query.tag : undefined;

  return queryPublishedArticles(event, { limit, offset, tagId });
});
