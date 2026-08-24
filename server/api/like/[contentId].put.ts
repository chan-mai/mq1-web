import { articleExists } from '~~/server/utils/article';
import crypto from 'node:crypto';
import { hashSecret } from '~~/server/utils/hashing';
import { getClientIP } from '~~/server/utils/ip';
import { getD1Drizzle } from '~~/server/utils/d1';
import { articleLikes } from '~~/server/db/schema';
import { likeParamsSchema } from '#shared/schemas/like';

export default defineEventHandler(async (event) => {
  const { contentId } = validateParams(event, likeParamsSchema);
  const userIp = getClientIP(event);

  const exists = await articleExists(event, contentId);
  if (!exists) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' });
  }

  const db = getD1Drizzle(event);

  // シークレットを生成
  const secret = crypto.randomUUID();
  const hashedSecret = await hashSecret(secret);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // いいねの新規作成
  // NOTE: MAP-E環境で同一IP扱いになることがあるらしいので、IPのユニーク制約を削除した(VercelがIPv6をサポートしないのが悪い)
  await db.insert(articleLikes).values({
    id,
    contentId,
    userIp,
    secret: hashedSecret,
    createdAt: now,
    updatedAt: now,
  });

  return {
    status: 'success',
    like: {
      id,
      contentId,
      userIp,
      createdAt: now,
      updatedAt: now,
      secret, // クライアント保存用 (平文を返す)
    },
    userIp,
  };
});
