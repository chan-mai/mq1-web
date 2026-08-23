import { eq } from "drizzle-orm";
import { siteSettings } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const db = getD1Drizzle(event);
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "pinned_article_ids"))
    .limit(1);

  let pinnedArticleIds: string[] = [];
  try {
    const parsed = JSON.parse(rows[0]?.value ?? "[]");
    if (Array.isArray(parsed)) {
      pinnedArticleIds = parsed.filter((id) => typeof id === "string");
    }
  } catch {
    pinnedArticleIds = [];
  }

  return { pinnedArticleIds };
});
