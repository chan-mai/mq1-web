import * as v from 'valibot';
import {
  ARTICLE_ID_PATTERN,
  nonEmptyId,
  parseableDate,
  queryInt,
} from './common';

// type確認のみ, 内部構造は非検証
export const tiptapDocSchema = v.looseObject({
  type: v.literal('doc'),
  content: v.optional(v.array(v.unknown())),
});

export const eyecatchInputSchema = v.object({
  key: v.pipe(v.string(), v.nonEmpty()),
  width: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  height: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
});

// undefined=変更なし, null=クリア
export const updateArticleBodySchema = v.object({
  title: v.optional(v.string()),
  content: v.optional(tiptapDocSchema),
  tagIds: v.optional(v.array(v.pipe(v.string(), v.nonEmpty()))),
  eyecatch: v.optional(v.nullable(eyecatchInputSchema)),
  isNoIndex: v.optional(v.boolean()),
  publishedAt: v.optional(v.nullable(parseableDate)),
});
export type UpdateArticleBody = v.InferOutput<typeof updateArticleBodySchema>;

// idは省略か空文字で自動採番
export const createArticleBodySchema = v.nullish(
  v.object({
    id: v.optional(
      v.pipe(
        v.string(),
        v.trim(),
        v.check(
          (id) => id === '' || ARTICLE_ID_PATTERN.test(id),
          'Invalid article id',
        ),
      ),
    ),
    title: v.optional(v.pipe(v.string(), v.trim())),
  }),
);

export const articleIdParamsSchema = v.object({ id: nonEmptyId });

export const contentIdParamsSchema = v.object({ contentId: nonEmptyId });

export const articleRevisionParamsSchema = v.object({
  id: nonEmptyId,
  revisionId: nonEmptyId,
});

export const articleListQuerySchema = v.object({
  limit: v.optional(queryInt({ min: 0, max: 50 })),
  offset: v.optional(queryInt({ min: 0, max: 100000 })),
  tag: v.optional(v.pipe(v.string(), v.nonEmpty())),
});

export const unpublishBodySchema = v.nullish(
  v.object({ status: v.optional(v.picklist(['draft', 'private'])) }),
);
