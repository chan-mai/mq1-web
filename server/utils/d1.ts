import { createError } from "h3";
import { drizzle } from "drizzle-orm/d1";

export const getD1Database = (event: any) => {
  const db = event?.context?.cloudflare?.env?.DB;
  if (!db) {
    throw createError({
      statusCode: 500,
      statusMessage: "D1 binding not configured",
      message: "Cloudflare D1 binding `DB` is missing",
    });
  }
  return db;
};

export const getD1Drizzle = (event: any) => {
  return drizzle(getD1Database(event));
};
