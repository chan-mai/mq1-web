import { requirePermission, Permission } from '../../../utils/auth';
import { prisma } from '../../../utils/prisma';

/**
 * 管理者ユーザーの権限を更新するAPI
 */
export default defineEventHandler(async (event) => {
  // ADMIN_USER_ADMIN権限チェック
  await requirePermission(event, Permission.ADMIN_USER_ADMIN);

  const userId = getRouterParam(event, 'userId') as string;
  const body = await readBody(event);
  const { permissions, isActive } = body;

  try {
    // ユーザーが存在するか確認
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'ユーザーが見つかりません',
      });
    }

    // 権限のバリデーション
    if (permissions && Array.isArray(permissions)) {
      const validPermissions = Object.values(Permission);
      const invalidPermissions = permissions.filter(
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

    // トランザクションで更新
    const updatedUser = await prisma.$transaction(async (tx) => {
      // isActiveが指定されている場合は更新
      if (typeof isActive === 'boolean') {
        await tx.adminUser.update({
          where: { id: userId },
          data: { isActive },
        });
      }

      // 権限が指定されている場合は更新
      if (permissions && Array.isArray(permissions)) {
        // 既存の権限を削除
        await tx.adminPermission.deleteMany({
          where: { adminId: userId },
        });

        // 新しい権限を追加
        if (permissions.length > 0) {
          await tx.adminPermission.createMany({
            data: permissions.map((permission: Permission) => ({
              adminId: userId,
              permission,
            })),
          });
        }
      }

      // 更新後のユーザー情報を取得
      return await tx.adminUser.findUnique({
        where: { id: userId },
        include: {
          permissions: {
            select: {
              permission: true,
            },
          },
        },
      });
    });

    return {
      status: 'success',
      message: 'ユーザー情報を更新しました',
      user: updatedUser
        ? {
            id: updatedUser.id,
            githubUsername: updatedUser.githubUsername,
            githubUserId: updatedUser.githubUserId.toString(),
            displayName: updatedUser.displayName,
            email: updatedUser.email,
            avatarUrl: updatedUser.avatarUrl,
            isActive: updatedUser.isActive,
            permissions: updatedUser.permissions.map((p) => p.permission),
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          }
        : null,
    };
  } catch (error) {
    console.error('Failed to update admin user:', error);
    
    // createErrorで生成されたエラーはそのまま投げる
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'ユーザー情報の更新に失敗しました',
    });
  }
});
