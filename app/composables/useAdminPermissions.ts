import type { Permission } from "@prisma/client";

/**
 * 管理者の権限を管理するcomposable
 */
export const useAdminPermissions = () => {
  const permissions = useState<Permission[]>("admin-permissions", () => []);
  const isLoading = useState("admin-permissions-loading", () => false);

  /**
   * 権限情報を取得
   */
  const fetchPermissions = async () => {
    if (!process.client || isLoading.value) {
      return;
    }

    isLoading.value = true;

    try {
      const result = await $fetch<{ permissions: Permission[] }>(
        "/api/admin/permissions",
        {
          credentials: "include",
        }
      );

      permissions.value = result.permissions ?? [];
    } catch (e) {
      console.error("権限の取得に失敗しました:", e);
      permissions.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  // ログイン状態が変わったら権限を取得
  if (process.client) {
    const { loggedIn } = useUserSession();

    watch(
      () => loggedIn.value,
      async (isLoggedIn) => {
        if (isLoggedIn) {
          await fetchPermissions();
        } else {
          permissions.value = [];
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
    fetchPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
