import type { H3Event } from 'h3';

/**
 * BASIC認証をチェックする関数
 * @param event H3Event
 * @returns 認証が成功した場合はtrue、失敗した場合はfalse
 */
export const checkBasicAuth = (event: H3Event): boolean => {
  const config = useRuntimeConfig();
  const adminUsername = config.adminUsername || 'admin';
  const adminPassword = config.adminPassword || 'password';

  // Authorizationヘッダーを取得
  const authHeader = getHeader(event, 'authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    // "Basic " を除去してBase64デコード
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // 認証情報を検証
    return username === adminUsername && password === adminPassword;
  } catch (error) {
    console.error('Failed to parse Basic Auth credentials:', error);
    return false;
  }
};

/**
 * BASIC認証が必要なエンドポイントで使用するヘルパー関数
 * 認証に失敗した場合は401エラーを返す
 * @param event H3Event
 */
export const requireBasicAuth = (event: H3Event): void => {
  if (!checkBasicAuth(event)) {
    // WWW-Authenticateヘッダーを設定してブラウザにBASIC認証を促す
    setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="Admin Area"');
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
      message: 'Please provide valid credentials',
    });
  }
};

