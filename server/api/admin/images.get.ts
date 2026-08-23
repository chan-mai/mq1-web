import { desc } from "drizzle-orm";
import { images } from "~~/server/db/schema";
import { getD1Drizzle } from "~~/server/utils/d1";

export default defineEventHandler(async (event) => {
  const db = getD1Drizzle(event);
  const rows = await db.select().from(images).orderBy(desc(images.uploadedAt));

  return {
    images: rows.map((row) => ({
      key: row.key,
      url: `/images/r2/${row.key}`,
      size: row.size,
      width: row.width,
      height: row.height,
      uploaded: row.uploadedAt,
    })),
  };
});
