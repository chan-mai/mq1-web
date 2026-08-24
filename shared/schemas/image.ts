import * as v from 'valibot';
import { imageKey } from './common';

export const imageKeyParamsSchema = v.object({ key: imageKey });

export const imageMimeSchema = v.picklist([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);
export type ImageMime = v.InferOutput<typeof imageMimeSchema>;

// multipart文字列→正整数
export const imageDimensionSchema = v.optional(
  v.pipe(v.string(), v.regex(/^\d+$/), v.transform(Number), v.minValue(1)),
);
