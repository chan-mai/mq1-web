import { fetchArticleByContentId } from "~~/server/utils/article";
import { isAuthenticated } from "~~/server/utils/session";
import {
  articleDetailQuerySchema,
  articleIdParamsSchema,
} from "#shared/schemas/article";

export default defineEventHandler(async (event) => {
  const { id } = validateParams(event, articleIdParamsSchema);

  // preview=1 + adminセッションで下書き閲覧可
  const preview =
    validateQuery(event, articleDetailQuerySchema).preview === "1" &&
    (await isAuthenticated(event));

  const article = await fetchArticleByContentId(event, id, {
    includeDraft: preview,
  });
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" });
  }
  return article;
});
