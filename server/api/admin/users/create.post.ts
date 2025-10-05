import { requirePermission, Permission } from '../../../utils/auth';
import { prisma } from '../../../utils/prisma';

/**
 * 管理者ユーザーを作成するAPI
 */
export default defineEventHandler(async (event) => {
  // ADMIN_USER_ADMIN権限チェック
  await requirePermission(event, Permission.ADMIN_USER_ADMIN);

  const body = await readBody(event);
  const { githubUsername, permissions } = body;

  if (!githubUsername) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'GitHubユーザー名は必須です',
    });
  }

  try {
    // 既に登録されているか確認
    const existing = await prisma.adminUser.findUnique({
      where: { githubUsername },
    });

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'このユーザーは既に登録されています',
      });
    }

    // 権限のバリデーション
    const permissionsToCreate = permissions || [];
    if (Array.isArray(permissionsToCreate)) {
      const validPermissions = Object.values(Permission);
      const invalidPermissions = permissionsToCreate.filter(
        (p: string) => !validPermissions.includes(p as Permission)
      );

      if (invalidPermissions.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: `無効な権限: ${invalidPermissions.join(', ')}`,
        });
      }
    }

    // ユーザーを作成
    const newUser = await prisma.adminUser.create({
      data: {
        githubUsername,
        githubUserId: BigInt(0), // 初回ログイン時に更新される
        isActive: true,
        permissions: {
          create: permissionsToCreate.map((permission: Permission) => ({
            permission,
          })),
        },
      },
      include: {
        permissions: {
          select: {
            permission: true,
          },
        },
      },
    });

    return {
      status: 'success',
      message: '管理者ユーザーを作成しました',
      user: {
        id: newUser.id,
        githubUsername: newUser.githubUsername,
        githubUserId: newUser.githubUserId.toString(),
        displayName: newUser.displayName,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
        isActive: newUser.isActive,
        permissions: newUser.permissions.map((p) => p.permission),
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    };
  } catch (error) {
    console.error('Failed to create admin user:', error);

    // createErrorで生成されたエラーはそのまま投げる
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '管理者ユーザーの作成に失敗しました',
    });
  }
});
