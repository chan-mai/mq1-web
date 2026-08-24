import * as v from 'valibot';
import { parseableDate } from './common';

export const searchQuerySchema = v.object({
  q: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200))),
  // slug形式は検証しない(未知slugは空結果200)
  tags: v.optional(
    v.pipe(
      v.string(),
      v.transform((value) => value.split(',').filter(Boolean)),
      v.maxLength(10),
    ),
  ),
  since: v.optional(parseableDate),
  until: v.optional(parseableDate),
});

export const popularArticlesQuerySchema = v.object({
  excludeId: v.optional(v.pipe(v.string(), v.maxLength(64))),
});

export const linkPreviewQuerySchema = v.object({
  url: v.pipe(v.string(), v.trim(), v.nonEmpty(), v.maxLength(2048)),
});
