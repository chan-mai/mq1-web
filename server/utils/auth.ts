import type { H3Event } from 'h3';

/**
 * セッション認証をチェックする関数
 * @param event H3Event
 * @returns ユーザーセッション情報
 */
export const requireAdminSession = async (event: H3Event) => {
  const session = await getUserSession(event);
  
  if (!session || !session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '認証が必要です。ログインしてください。',
    });
  }

  // chan-maiのみ許可
  if (session.user.username !== 'chan-mai') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'このアカウントには管理者権限がありません',
    });
  }

  return session;
};

