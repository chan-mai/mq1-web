import { getR2Bucket } from "~~/server/utils/r2";

const KEY_PATTERN = /^[a-zA-Z0-9/_-]+\.[a-z0-9]+$/;

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, "key");
  if (!key || key.includes("..") || !KEY_PATTERN.test(key)) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  const bucket = getR2Bucket(event);
  const object = await bucket.get(key);
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  const etag = object.httpEtag as string;
  if (getHeader(event, "if-none-match") === etag) {
    setResponseStatus(event, 304);
    return null;
  }

  setResponseHeaders(event, {
    "Content-Type":
      object.httpMetadata?.contentType ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
  });

  return object.body;
});
