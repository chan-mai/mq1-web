import { getAdminPermissions } from '../../utils/auth';

/**
 * ログイン中の管理者の権限一覧を取得するAPI
 */
export default defineEventHandler(async (event) => {
  const permissions = await getAdminPermissions(event);
  
  return {
    permissions,
  };
});
