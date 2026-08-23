import { fetchArticleByContentId } from "~~/server/utils/article";
import { isAuthenticated } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Id is required" });
  }

  // preview=1 + adminセッションで下書き閲覧可
  const preview =
    getQuery(event).preview === "1" && (await isAuthenticated(event));

  const article = await fetchArticleByContentId(event, id, {
    includeDraft: preview,
  });
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" });
  }
  return article;
});
