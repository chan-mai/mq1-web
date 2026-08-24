import { nanoid } from 'nanoid';
import { images } from '~~/server/db/schema';
import { getD1Drizzle } from '~~/server/utils/d1';
import { getR2Bucket } from '~~/server/utils/r2';
import { stripImageMetadata } from '~~/server/utils/strip-image-metadata';
import {
  imageDimensionSchema,
  imageMimeSchema,
  type ImageMime,
} from '#shared/schemas/image';

const EXTENSION_BY_MIME: Record<ImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  if (!parts) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Multipart body is required',
    });
  }

  const filePart = parts.find((part) => part.name === 'file');
  if (!filePart || !filePart.data || filePart.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' });
  }

  const mime = parseOrThrow(imageMimeSchema, filePart.type ?? '');
  const extension = EXTENSION_BY_MIME[mime];

  if (filePart.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'File too large' });
  }

  const readDimension = (name: string) => {
    const raw = parts.find((part) => part.name === name)?.data?.toString();
    return parseOrThrow(imageDimensionSchema, raw) ?? null;
  };

  const now = new Date();
  const key = `${nanoid(16)}.${extension}`;

  const bucket = getR2Bucket(event);
  // PNG/WebPのmetadata排除
  const body = stripImageMetadata(new Uint8Array(filePart.data), mime);
  await bucket.put(key, body, {
    httpMetadata: { contentType: mime },
  });

  const width = readDimension('width');
  const height = readDimension('height');

  await getD1Drizzle(event).insert(images).values({
    key,
    size: body.byteLength,
    width,
    height,
    contentType: mime,
    uploadedAt: now.toISOString(),
  });

  return {
    key,
    url: `/images/r2/${key}`,
    width,
    height,
  };
});
