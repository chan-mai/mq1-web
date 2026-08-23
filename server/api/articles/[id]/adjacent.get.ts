import {
  fetchAdjacentArticles,
  fetchArticleByContentId,
} from "~~/server/utils/article";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Id is required" });
  }

  const article = await fetchArticleByContentId(event, id);
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" });
  }

  return fetchAdjacentArticles(event, article.publishedAt);
});
