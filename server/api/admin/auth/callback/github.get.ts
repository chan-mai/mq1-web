export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user, tokens }) {
    // chan-maiのみ許可
    if (user.login !== 'chan-mai') {
      console.warn(`Unauthorized login attempt by user: ${user.login}`);
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'このアカウントには管理者権限がありません',
      });
    }

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
