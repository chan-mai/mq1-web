import * as v from "valibot";

export const ARTICLE_ID_PATTERN = /^[a-zA-Z0-9_-]{3,64}$/;
export const TAG_SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;
export const IMAGE_KEY_PATTERN = /^[a-zA-Z0-9/_-]+\.[a-z0-9]+$/;

// 公開ルートparam用の緩い検証(存在確認はDB側の404)
export const nonEmptyId = v.pipe(v.string(), v.nonEmpty(), v.maxLength(64));

export const tagSlug = v.pipe(v.string(), v.trim(), v.regex(TAG_SLUG_PATTERN));

export const imageKey = v.pipe(
  v.string(),
  v.check((key) => !key.includes("..")),
  v.regex(IMAGE_KEY_PATTERN),
);

// Date.parse可能な文字列
export const parseableDate = v.pipe(
  v.string(),
  v.nonEmpty(),
  v.check((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date"),
);

// クエリ文字列→整数
export const queryInt = (opts: { min: number; max: number }) =>
  v.pipe(
    v.string(),
    v.regex(/^\d+$/, "Expected a non-negative integer"),
    v.transform(Number),
    v.minValue(opts.min),
    v.maxValue(opts.max),
  );
