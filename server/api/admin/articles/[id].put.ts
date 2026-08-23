import { eq, inArray, sql } from "drizzle-orm";
import { articleRevisions, articles, tags } from "~~/server/db/schema";
import {
  fetchTagsForArticles,
  replaceArticleTags,
  serializeAdminArticle,
} from "~~/server/utils/admin-article";
import { getD1Drizzle } from "~~/server/utils/d1";

interface UpdateArticleBody {
  title?: string;
  content?: TiptapDoc;
  tagIds?: string[];
  eyecatch?: { key: string; width?: number; height?: number } | null;
  isNoIndex?: boolean;
  publishedAt?: string | null;
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Id is required" });
  }

  const body = await readBody<UpdateArticleBody>(event);
  if (!body || typeof body !== "object") {
    throw createError({ statusCode: 400, statusMessage: "Invalid body" });
  }

  const db = getD1Drizzle(event);
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  const current = rows[0];
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: "Article not found" });
  }

  const update: Partial<typeof current> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof body.title === "string") {
    update.title = body.title;
  }

  if (body.content !== undefined) {
    if (
      !body.content ||
      typeof body.content !== "object" ||
      body.content.type !== "doc"
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid content document",
      });
    }
    update.content = JSON.stringify(body.content);
    update.plainText = extractPlainText(body.content);
    update.charCount = countContentCharacters(body.content);
    // 概要は本文先頭からの自動生成のみ
    update.summary = generateSummary(body.content);
  }

  if (body.eyecatch !== undefined) {
    if (body.eyecatch === null) {
      update.eyecatchKey = null;
      update.eyecatchWidth = null;
      update.eyecatchHeight = null;
    } else if (typeof body.eyecatch.key === "string" && body.eyecatch.key) {
      update.eyecatchKey = body.eyecatch.key;
      update.eyecatchWidth = body.eyecatch.width ?? null;
      update.eyecatchHeight = body.eyecatch.height ?? null;
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid eyecatch",
      });
    }
  }

  if (typeof body.isNoIndex === "boolean") {
    update.isNoIndex = body.isNoIndex;
  }

  if (typeof body.publishedAt === "string" && body.publishedAt) {
    const date = new Date(body.publishedAt);
    if (Number.isNaN(date.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid publishedAt",
      });
    }
    update.publishedAt = date.toISOString();
  }

  if (body.tagIds !== undefined) {
    if (
      !Array.isArray(body.tagIds) ||
      body.tagIds.some((tagId) => typeof tagId !== "string")
    ) {
      throw createError({ statusCode: 400, statusMessage: "Invalid tagIds" });
    }
    const uniqueTagIds = [...new Set(body.tagIds)];
    if (uniqueTagIds.length > 0) {
      const found = await db
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.id, uniqueTagIds));
      if (found.length !== uniqueTagIds.length) {
        throw createError({ statusCode: 400, statusMessage: "Unknown tag" });
      }
    }
    await replaceArticleTags(db, id, uniqueTagIds);
  }

  await db.update(articles).set(update).where(eq(articles.id, id));

  // タイトルか本文の変更時のみリビジョンを記録(最新50件を保持)
  const revisionTitle = update.title ?? current.title;
  const revisionContent = update.content ?? current.content;
  if (
    revisionTitle !== current.title ||
    revisionContent !== current.content
  ) {
    await db.insert(articleRevisions).values({
      id: crypto.randomUUID(),
      articleId: id,
      title: revisionTitle,
      content: revisionContent,
      createdAt: update.updatedAt!,
    });
    await db.run(
      sql`DELETE FROM article_revisions WHERE article_id = ${id} AND id NOT IN (SELECT id FROM article_revisions WHERE article_id = ${id} ORDER BY created_at DESC LIMIT 50)`,
    );
  }

  const updatedRows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  const tagMap = await fetchTagsForArticles(db, [id]);
  return serializeAdminArticle(updatedRows[0]!, tagMap.get(id) ?? []);
});
