<script setup lang="ts">
import type { Permission } from '../../../generated/prisma/enums';

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false
});

// メタタグ設定
useHead({
  title: 'Admin Console - 管理者',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
});

const { hasPermission } = useAdminPermissions();

// 権限の表示名マップ
const permissionLabels: Record<string, string> = {
  COMMENT_VIEW: 'コメント閲覧',
  COMMENT_ADMIN: 'コメント管理',
  FAVORITE_VIEW: 'お気に入り閲覧',
  FAVORITE_ADMIN: 'お気に入り管理',
  FEED_STATS_VIEW: 'フィード統計閲覧',
  ADMIN_USER_VIEW: '管理者ユーザー閲覧',
  ADMIN_USER_ADMIN: '管理者ユーザー管理',
};

const allPermissions = Object.keys(permissionLabels) as Permission[];

interface AdminUser {
  id: string;
  githubUsername: string;
  githubUserId: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

// State
const users = ref<AdminUser[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// 新規ユーザー作成用
const showCreateDialog = ref(false);
const newUsername = ref('');
const newPermissions = ref<Permission[]>([]);
const creating = ref(false);

// 編集用
const editingUser = ref<AdminUser | null>(null);
const editPermissions = ref<Permission[]>([]);
const editIsActive = ref(true);
const updating = ref(false);

// ユーザー一覧を取得
const fetchUsers = async () => {
  loading.value = true;
  error.value = null;

  try {
    const { data, error: fetchError } = await useFetch<{ status: string; users: AdminUser[] }>(
      '/api/admin/users/list',
      { server: false }
    );
    
    if (fetchError.value) {
      throw fetchError.value;
    }
    
    users.value = data.value.users;
  } catch (err: any) {
    error.value = err.data?.message || 'ユーザー一覧の取得に失敗しました';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 新規ユーザーを作成
const createUser = async () => {
  if (!newUsername.value.trim()) {
    useToast().error({
      title: 'GitHubユーザー名を入力してください',
    });
    return;
  }

  creating.value = true;

  try {
    await $fetch('/api/admin/users/create', {
      method: 'POST',
      body: {
        githubUsername: newUsername.value.trim(),
        permissions: newPermissions.value,
      },
    });

    useToast().success({
      title: '管理者ユーザーを作成しました',
    });
    showCreateDialog.value = false;
    newUsername.value = '';
    newPermissions.value = [];
    await fetchUsers();
  } catch (err: any) {
    useToast().error({
      title: err.data?.message || 'ユーザーの作成に失敗しました',
    });
    console.error(err);
  } finally {
    creating.value = false;
  }
};

// 編集ダイアログを開く
const openEditDialog = (user: AdminUser) => {
  editingUser.value = user;
  editPermissions.value = [...user.permissions];
  editIsActive.value = user.isActive;
};

// ユーザーを更新
const updateUser = async () => {
  if (!editingUser.value) return;

  updating.value = true;

  try {
    await $fetch(`/api/admin/users/${editingUser.value.id}`, {
      method: 'PATCH',
      body: {
        permissions: editPermissions.value,
        isActive: editIsActive.value,
      },
    });

    useToast().success({
      title: 'ユーザー情報を更新しました',
    });
    editingUser.value = null;
    await fetchUsers();
  } catch (err: any) {
    useToast().error({
      title: err.data?.message || 'ユーザー情報の更新に失敗しました',
    });
    console.error(err);
  } finally {
    updating.value = false;
  }
};

// 権限のトグル（新規作成用）
const toggleNewPermission = (permission: Permission) => {
  const index = newPermissions.value.indexOf(permission);
  if (index > -1) {
    newPermissions.value.splice(index, 1);
  } else {
    newPermissions.value.push(permission);
  }
};

// 権限のトグル（編集用）
const toggleEditPermission = (permission: Permission) => {
  const index = editPermissions.value.indexOf(permission);
  if (index > -1) {
    editPermissions.value.splice(index, 1);
  } else {
    editPermissions.value.push(permission);
  }
};

// マウント時にユーザー一覧を取得
onMounted(() => {
  fetchUsers();
});

// 権限チェック
const canView = computed(() => hasPermission('ADMIN_USER_VIEW' as Permission));
const canAdmin = computed(() => hasPermission('ADMIN_USER_ADMIN' as Permission));
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- ヘッダー -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl text-gray-900">管理者</h1>
          <p class="mt-1 text-sm text-gray-600">
            管理者と権限の管理
          </p>
        </div>
        <button
          v-if="canAdmin"
          @click="showCreateDialog = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Icon name="mdi:plus" class="w-5 h-5" />
          新規ユーザー追加
        </button>
      </div>
    </div>

    <!-- 権限チェック -->
    <div v-if="!canView" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <Icon name="mdi:alert" class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 class="font-medium text-yellow-800">権限がありません</h3>
          <p class="mt-1 text-sm text-yellow-700">
            管理者ユーザーを閲覧する権限がありません。
          </p>
        </div>
      </div>
    </div>

    <!-- ユーザー一覧 -->
    <div v-else-if="!loading && users.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ユーザー
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                権限
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状態
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日
              </th>
              <th v-if="canAdmin" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <img
                    v-if="user.avatarUrl"
                    :src="user.avatarUrl"
                    :alt="user.githubUsername"
                    class="w-10 h-10 rounded-full"
                  />
                  <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Icon name="mdi:account" class="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">
                      {{ user.displayName || user.githubUsername }}
                    </div>
                    <div class="text-sm text-gray-500">@{{ user.githubUsername }}</div>
                    <div v-if="user.email" class="text-xs text-gray-400">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="permission in user.permissions"
                    :key="permission"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ permissionLabels[permission] || permission }}
                  </span>
                  <span v-if="user.permissions.length === 0" class="text-sm text-gray-400">
                    権限なし
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ user.isActive ? '有効' : '無効' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ new Date(user.createdAt).toLocaleDateString('ja-JP') }}
              </td>
              <td v-if="canAdmin" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="openEditDialog(user)"
                  class="text-primary hover:text-primary/80"
                >
                  編集
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ローディング -->
    <div v-else-if="loading" class="flex justify-center items-center py-12">
      <div class="text-gray-500">読み込み中...</div>
    </div>

    <!-- エラー -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- データなし -->
    <div v-else class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
      <Icon name="mdi:account-group" class="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <p>管理者ユーザーがいません</p>
    </div>

    <!-- 新規作成ダイアログ -->
    <Teleport to="body">
      <div
        v-if="showCreateDialog"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="showCreateDialog = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">新規管理者ユーザー追加</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                GitHubユーザー名 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="newUsername"
                type="text"
                placeholder="例: chan-mai"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                権限
              </label>
              <div class="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                <label
                  v-for="permission in allPermissions"
                  :key="permission"
                  class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    :checked="newPermissions.includes(permission)"
                    @change="toggleNewPermission(permission)"
                    class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span class="text-sm text-gray-700">
                    {{ permissionLabels[permission] || permission }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="mt-6 flex gap-3 justify-end">
            <button
              @click="showCreateDialog = false"
              :disabled="creating"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              @click="createUser"
              :disabled="creating || !newUsername.trim()"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {{ creating ? '作成中...' : '作成' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 編集ダイアログ -->
    <Teleport to="body">
      <div
        v-if="editingUser"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click.self="editingUser = null"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">ユーザー編集</h2>
          
          <div class="mb-4">
            <div class="flex items-center gap-3">
              <img
                v-if="editingUser.avatarUrl"
                :src="editingUser.avatarUrl"
                :alt="editingUser.githubUsername"
                class="w-12 h-12 rounded-full"
              />
              <div>
                <div class="font-medium text-gray-900">
                  {{ editingUser.displayName || editingUser.githubUsername }}
                </div>
                <div class="text-sm text-gray-500">@{{ editingUser.githubUsername }}</div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="editIsActive"
                  type="checkbox"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span class="text-sm font-medium text-gray-700">
                  アクティブ（ログイン可能）
                </span>
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                権限
              </label>
              <div class="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                <label
                  v-for="permission in allPermissions"
                  :key="permission"
                  class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    :checked="editPermissions.includes(permission)"
                    @change="toggleEditPermission(permission)"
                    class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span class="text-sm text-gray-700">
                    {{ permissionLabels[permission] || permission }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="mt-6 flex gap-3 justify-end">
            <button
              @click="editingUser = null"
              :disabled="updating"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              @click="updateUser"
              :disabled="updating"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {{ updating ? '更新中...' : '更新' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
