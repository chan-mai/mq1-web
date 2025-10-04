export default defineNuxtRouteMiddleware(async (to, from) => {
    // /admin/**意外はスキップ
    if (!to.path.startsWith('/admin/')) return;

    // サインインページはスキップ
    if (to.path === '/admin/signin') return;

    const { loggedIn } = useUserSession();
  
    if (!loggedIn.value) {
      // リダイレクト先を保存
      const redirect = useCookie('redirect');
      redirect.value = to.fullPath;
      return navigateTo('/admin/signin', { replace: true });
    }
  });
