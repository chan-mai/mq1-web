import { eq } from "drizzle-orm";
import { siteSettings } from "~~/server/db/schema";
import { queryPublishedArticles } from "~~/server/utils/article";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const db = getD1Drizzle(event);
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "pinned_article_ids"))
    .limit(1);

  let pinnedIds: string[] = [];
  try {
    const parsed = JSON.parse(rows[0]?.value ?? "[]");
    if (Array.isArray(parsed)) {
      pinnedIds = parsed.filter((id) => typeof id === "string");
    }
  } catch {
    pinnedIds = [];
  }

  const { contents } = await queryPublishedArticles(event, { ids: pinnedIds });
  // 設定順を維持
  const byId = new Map(contents.map((article) => [article.id, article]));
  const pinnedArticles = pinnedIds
    .map((id) => byId.get(id))
    .filter((article): article is Article => Boolean(article));

  return { pinnedArticles };
});
