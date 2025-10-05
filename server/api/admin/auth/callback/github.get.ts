import { prisma } from '../../../../utils/prisma';

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user, tokens }) {
    // DBから管理者情報を取得
    let adminUser = await prisma.adminUser.findUnique({
      where: {
        githubUsername: user.login,
      },
    });

    // 管理者として登録されていない場合はエラー
    if (!adminUser) {
      console.warn(`Unauthorized login attempt by user: ${user.login}`);
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'このアカウントには管理者権限がありません',
      });
    }

    // 非アクティブの場合もエラー
    if (!adminUser.isActive) {
      console.warn(`Login attempt by inactive admin user: ${user.login}`);
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'このアカウントは無効化されています',
      });
    }

    // 管理者情報を更新（GitHubの最新情報を反映）
    adminUser = await prisma.adminUser.update({
      where: {
        id: adminUser.id,
      },
      data: {
        githubUserId: BigInt(user.id),
        displayName: user.name || undefined,
        email: user.email || undefined,
        avatarUrl: user.avatar_url || undefined,
      },
    });

    // セッションに追加で保存するユーザー情報
    await setUserSession(event, {
      user: {
        userId: user.id,
        username: user.login,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
      },
      loggedInAt: new Date(),
    });
    
    const redirect = getCookie(event, "redirect") || "/admin/dashboard";
    deleteCookie(event, "redirect");
    return sendRedirect(event, redirect);
  },

  onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/admin/signin");
  },
});
