import { requirePermission, Permission } from '../../../utils/auth';
import { prisma } from '../../../utils/prisma';

/**
 * 管理者ユーザー一覧を取得するAPI
 */
export default defineEventHandler(async (event) => {
  // ADMIN_USER_VIEW権限チェック
  await requirePermission(event, Permission.ADMIN_USER_VIEW);

  try {
    const users = await prisma.adminUser.findMany({
      include: {
        permissions: {
          select: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      status: 'success',
      users: users.map((user) => ({
        id: user.id,
        githubUsername: user.githubUsername,
        githubUserId: user.githubUserId.toString(),
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        permissions: user.permissions.map((p) => p.permission),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '管理者ユーザー一覧の取得に失敗しました',
    });
  }
});
