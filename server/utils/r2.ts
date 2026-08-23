import { createError } from "h3";

export const getR2Bucket = (event: any) => {
  const bucket = event?.context?.cloudflare?.env?.IMAGES;
  if (!bucket) {
    throw createError({
      statusCode: 500,
      statusMessage: "R2 binding not configured",
      message: "Cloudflare R2 binding `IMAGES` is missing",
    });
  }
  return bucket;
};
