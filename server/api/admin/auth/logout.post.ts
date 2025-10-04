export default defineEventHandler(async (event) => {
  // セッションをクリア
  await clearUserSession(event);
  
  return {
    status: 'success',
    message: 'ログアウトしました',
  };
});
