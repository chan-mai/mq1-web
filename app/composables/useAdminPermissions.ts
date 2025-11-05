import type { Permission } from "@prisma/client";

/**
 * 管理者の権限を管理するcomposable
 */
export const useAdminPermissions = () => {
  const permissions = useState<Permission[]>("admin-permissions", () => []);
  const isLoading = useState("admin-permissions-loading", () => false);
  const error = useState<Error | null>("admin-permissions-error", () => null);
  const hasInitialized = useState("admin-permissions-initialized", () => false);

  const resetPermissions = () => {
    permissions.value = [];
    hasInitialized.value = false;
  };

  /**
   * 権限情報を取得
   */
  const fetchPermissions = async ({ force } = { force: false }) => {
    if (!process.client) {
      return;
    }

    if (isLoading.value) {
      return;
    }

    if (!force && hasInitialized.value && permissions.value.length > 0) {
      return;
    }

    console.log("[useAdminPermissions] fetchPermissions called");
    isLoading.value = true;
    error.value = null;

    try {
      const result = await $fetch<{ permissions: Permission[] }>(
        "/api/admin/permissions",
        {
          credentials: "include",
        }
      );

      permissions.value = result.permissions ?? [];
      hasInitialized.value = true;
      console.log(
        "[useAdminPermissions] permissions updated to:",
        permissions.value
      );
    } catch (e) {
      console.error("[useAdminPermissions] Error:", e);
      error.value = e as Error;
      resetPermissions();
    } finally {
      isLoading.value = false;
    }
  };

  if (process.client) {
    const { loggedIn } = useUserSession();

    watch(
      () => loggedIn.value,
      async (isLoggedIn) => {
        if (isLoggedIn) {
          await fetchPermissions({ force: true });
        } else {
          resetPermissions();
        }
      },
      { immediate: true }
    );
  }

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
