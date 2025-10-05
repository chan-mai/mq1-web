import type { H3Event } from 'h3';
import type { Permission } from '@prisma/client';
import { prisma } from './prisma';

export { Permission } from '@prisma/client';

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

  // DBから管理者情報を取得
  const adminUser = await prisma.adminUser.findUnique({
    where: {
      githubUsername: session.user.username,
    },
    include: {
      permissions: true,
    },
  });

  // 管理者として登録されていない、または非アクティブの場合はエラー
  if (!adminUser || !adminUser.isActive) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'このアカウントには管理者権限がありません',
    });
  }

  return { session, adminUser };
};

/**
 * 指定した権限を持っているかチェックする関数
 * @param event H3Event
 * @param requiredPermission 必要な権限
 * @returns ユーザーセッション情報と管理者情報
 */
export const requirePermission = async (
  event: H3Event,
  requiredPermission: Permission
) => {
  const { session, adminUser } = await requireAdminSession(event);

  const hasPermission = adminUser.permissions.some(
    (p) => p.permission === requiredPermission
  );

  if (!hasPermission) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'この操作を実行する権限がありません',
    });
  }

  return { session, adminUser };
};

/**
 * 複数の権限のうち、いずれか1つを持っているかチェックする関数
 * @param event H3Event
 * @param requiredPermissions 必要な権限の配列
 * @returns ユーザーセッション情報と管理者情報
 */
export const requireAnyPermission = async (
  event: H3Event,
  requiredPermissions: Permission[]
) => {
  const { session, adminUser } = await requireAdminSession(event);

  const hasAnyPermission = adminUser.permissions.some(
    (p) => requiredPermissions.includes(p.permission)
  );

  if (!hasAnyPermission) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'この操作を実行する権限がありません',
    });
  }

  return { session, adminUser };
};

/**
 * 管理者の権限情報を取得する関数
 * @param event H3Event
 * @returns 管理者の権限一覧
 */
export const getAdminPermissions = async (event: H3Event): Promise<Permission[]> => {
  try {
    const { adminUser } = await requireAdminSession(event);
    return adminUser.permissions.map((p) => p.permission);
  } catch (error) {
    return [];
  }
};

