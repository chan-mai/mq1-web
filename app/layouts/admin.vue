<script setup lang="ts">
// Admin Console専用レイアウト
const route = useRoute();
const { user } = useUserSession();
const { permissions, hasAnyPermission } = useAdminPermissions();

// サイドバーの開閉状態（モバイル用）
const sidebarOpen = ref(false);

// ナビゲーションメニュー（権限に基づいてフィルタリング）
const menuItems = computed(() => {
  const allMenuItems = [
    {
      name: 'ダッシュボード',
      path: '/admin/dashboard',
      icon: 'mdi:view-dashboard',
      requiredPermissions: [] as string[], // 権限不要
    },
    {
      name: 'コメント',
      path: '/admin/comments',
      icon: 'mdi:comment-text-multiple',
      requiredPermissions: ['COMMENT_VIEW'] as string[],
    },
    {
      name: 'いいね',
      path: '/admin/favorites',
      icon: 'mdi:heart',
      requiredPermissions: ['FAVORITE_VIEW'] as string[],
    },
    {
      name: 'フィード統計',
      path: '/admin/feed-stats',
      icon: 'mdi:chart-line',
      requiredPermissions: ['FEED_STATS_VIEW'] as string[],
    },
    {
      name: '管理者',
      path: '/admin/users',
      icon: 'mdi:account-group',
      requiredPermissions: ['ADMIN_USER_VIEW'] as string[],
    },
  ];

  // 権限に基づいてメニューをフィルタリング
  return allMenuItems.filter((item) => {
    if (item.requiredPermissions.length === 0) {
      return true; // 権限不要の場合は常に表示
    }
    return hasAnyPermission(item.requiredPermissions as any);
  });
});

// ログアウト処理
const handleLogout = async () => {
  if (!confirm('ログアウトしますか？')) {
    return;
  }
  
  try {
    await $fetch('/api/admin/auth/logout', { method: 'POST' });
    navigateTo('/admin/signin');
  } catch (err) {
    console.error('Logout failed:', err);
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Admin Consoleヘッダー -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <!-- モバイルメニューボタン -->
            <button
              @click="sidebarOpen = !sidebarOpen"
              class="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Icon name="mdi:menu" class="w-6 h-6" />
            </button>
            
            <Icon name="mdi:shield-account" class="w-6 h-6 text-primary" />
            <h1 class="text-xl font-bold text-gray-900">Admin Console</h1>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- ユーザー情報 -->
            <div v-if="user" class="hidden sm:flex items-center gap-3">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">{{ user.username }}</p>
                <p class="text-xs text-gray-500">{{ user.email }}</p>
              </div>
            </div>

            <!-- サイト表示リンク -->
            <NuxtLink
              to="/"
              target="_blank"
              class="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Icon name="mdi:open-in-new" class="w-4 h-4" />
              サイトを表示
            </NuxtLink>

            <!-- ログアウトボタン -->
            <button
              v-if="user"
              @click="handleLogout"
              class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Icon name="mdi:logout" class="w-4 h-4" />
              <span class="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- サイドバー -->
      <aside
        :class="[
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
        style="top: 64px;"
      >
        <nav class="h-[calc(100vh-64px)] overflow-y-auto p-4 space-y-1">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            @click="sidebarOpen = false"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              route.path === item.path
                ? 'bg-primary/10 text-primary'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            <Icon :name="item.icon" class="w-5 h-5" />
            <span>{{ item.name }}</span>
          </NuxtLink>
        </nav>
      </aside>

      <!-- オーバーレイ（モバイル時） -->
      <div
        v-if="sidebarOpen"
        @click="sidebarOpen = false"
        class="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
        style="top: 64px;"
      ></div>

      <!-- メインコンテンツ -->
      <main class="flex-1 min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Admin Console専用のスタイル */
</style>
