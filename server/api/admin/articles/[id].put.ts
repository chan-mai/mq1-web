import { eq, inArray, sql } from 'drizzle-orm';
import { articleRevisions, articles, tags } from '~~/server/db/schema';
import {
  fetchTagsForArticles,
  replaceArticleTags,
  serializeAdminArticle,
} from '~~/server/utils/admin-article';
import { getD1Drizzle } from '~~/server/utils/d1';
import {
  articleIdParamsSchema,
  updateArticleBodySchema,
} from '#shared/schemas/article';

export default defineEventHandler(async (event) => {
  const { id } = validateParams(event, articleIdParamsSchema);
  const body = await validateBody(event, updateArticleBodySchema);

  const db = getD1Drizzle(event);
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  const current = rows[0];
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' });
  }

  const update: Partial<typeof current> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.title !== undefined) {
    update.title = body.title;
  }

  if (body.content !== undefined) {
    const content = body.content as TiptapDoc;
    update.content = JSON.stringify(content);
    update.plainText = extractPlainText(content);
    update.charCount = countContentCharacters(content);
    // 概要は本文先頭からの自動生成のみ
    update.summary = generateSummary(content);
  }

  if (body.eyecatch !== undefined) {
    if (body.eyecatch === null) {
      update.eyecatchKey = null;
      update.eyecatchWidth = null;
      update.eyecatchHeight = null;
    } else {
      update.eyecatchKey = body.eyecatch.key;
      update.eyecatchWidth = body.eyecatch.width ?? null;
      update.eyecatchHeight = body.eyecatch.height ?? null;
    }
  }

  if (body.isNoIndex !== undefined) {
    update.isNoIndex = body.isNoIndex;
  }

  if (typeof body.publishedAt === 'string') {
    update.publishedAt = new Date(body.publishedAt).toISOString();
  }

  if (body.tagIds !== undefined) {
    const uniqueTagIds = [...new Set(body.tagIds)];
    if (uniqueTagIds.length > 0) {
      const found = await db
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.id, uniqueTagIds));
      if (found.length !== uniqueTagIds.length) {
        throw createError({ statusCode: 400, statusMessage: 'Unknown tag' });
      }
    }
    await replaceArticleTags(db, id, uniqueTagIds);
  }

  await db.update(articles).set(update).where(eq(articles.id, id));

  // タイトルか本文の変更時のみリビジョンを記録(最新50件を保持)
  const revisionTitle = update.title ?? current.title;
  const revisionContent = update.content ?? current.content;
  if (revisionTitle !== current.title || revisionContent !== current.content) {
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
