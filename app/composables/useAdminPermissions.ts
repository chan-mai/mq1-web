import type { Permission } from "@prisma/client";

/**
 * 管理者の権限を管理するcomposable
 */
export const useAdminPermissions = () => {
  const permissions = useState<Permission[]>("admin-permissions", () => []);
  const isLoading = useState("admin-permissions-loading", () => false);
  const error = useState<Error | null>("admin-permissions-error", () => null);

  /**
   * 権限情報を取得
   */
  const fetchPermissions = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await useFetch<{
        permissions: Permission[];
      }>("/api/admin/permissions");

      if (fetchError.value) {
        throw fetchError.value;
      }

      permissions.value = data.value?.permissions || [];
    } catch (e) {
      error.value = e as Error;
      permissions.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 指定した権限を持っているかチェック
   */
  const hasPermission = (permission: Permission): boolean => {
    return permissions.value.includes(permission);
  };

  /**
   * 指定した権限のいずれかを持っているかチェック
   */
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some((p) => permissions.value.includes(p));
  };

  /**
   * 指定した権限をすべて持っているかチェック
   */
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every((p) => permissions.value.includes(p));
  };

  return {
    permissions: readonly(permissions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
