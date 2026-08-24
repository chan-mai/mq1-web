import { createError, type H3Event } from 'h3';
import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';

export const getD1Database = (event: H3Event) => {
  const db = event?.context?.cloudflare?.env?.DB as D1Database | undefined;
  if (!db) {
    throw createError({
      statusCode: 500,
      statusMessage: 'D1 binding not configured',
      message: 'Cloudflare D1 binding `DB` is missing',
    });
  }
  return db;
};

export const getD1Drizzle = (event: H3Event) => {
  return drizzle(getD1Database(event));
};
