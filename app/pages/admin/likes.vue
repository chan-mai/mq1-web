<script setup lang="ts">
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '#shared/types/microccms';
import type { Permission } from '../../../generated/prisma/enums';
import type { ArticleLike } from '../../../generated/prisma/browser';

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  ssr: false
});

const { hasPermission } = useAdminPermissions();

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ContentIdCount {
  contentId: string;
  count: number;
}

interface Statistics {
  totalLikes: number;
  uniqueUsers: number;
  uniqueArticles: number;
}

// メタタグ設定
useHead({
  title: 'Admin Console - いいね',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
});

// 状態管理
const likes = ref<ArticleLike[]>([]);
const pagination = ref<Pagination | null>(null);
const contentIdCounts = ref<ContentIdCount[]>([]);
const statistics = ref<Statistics | null>(null);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

// 記事情報のキャッシュ
const articlesCache = ref<Map<string, MicroCMSObject<Article> | null>>(new Map());

// フィルター
const filterContentId = ref<string>('');
const filterUserIp = ref<string>('');
const currentPage = ref<number>(1);

// microCMSクライアント
const client = useMicroCMSClient();

// 記事情報を取得
const fetchArticle = async (contentId: string): Promise<MicroCMSObject<Article> | null> => {
  // キャッシュにあればそれを返す
  if (articlesCache.value.has(contentId)) {
    return articlesCache.value.get(contentId) || null;
  }

  try {
    const response = await client.getList<MicroCMSObject<Article>>({
      endpoint: 'articles',
      queries: {
        limit: 1,
        filters: `id[equals]${contentId}`,
      } satisfies MicroCMSQueries,
    });

    const article = response.contents && response.contents.length > 0 ? response.contents[0] : null;
    articlesCache.value.set(contentId, article);
    return article;
  } catch (err) {
    console.error(`Failed to fetch article ${contentId}:`, err);
    articlesCache.value.set(contentId, null);
    return null;
  }
};

// 複数の記事を一括取得
const fetchArticles = async (contentIds: string[]) => {
  const uniqueIds = [...new Set(contentIds)].filter(id => !articlesCache.value.has(id));
  
  if (uniqueIds.length === 0) return;

  try {
    // microCMSのフィルタで複数IDを指定
    const filters = uniqueIds.map(id => `id[equals]${id}`).join('[or]');
    const response = await client.getList<MicroCMSObject<Article>>({
      endpoint: 'articles',
      queries: {
        limit: uniqueIds.length,
        filters,
      } satisfies MicroCMSQueries,
    });

    // キャッシュに保存
    if (response.contents) {
      response.contents.forEach(article => {
        articlesCache.value.set(article.id, article);
      });
    }

    // 取得できなかったIDはnullとして保存
    uniqueIds.forEach(id => {
      if (!articlesCache.value.has(id)) {
        articlesCache.value.set(id, null);
      }
    });
  } catch (err) {
    console.error('Failed to fetch articles:', err);
  }
};

// いいね一覧を取得
const fetchArticleLike = async (page: number = 1) => {
  isLoading.value = true;
  error.value = null;

  try {
    const queryParams: Record<string, any> = {
      page,
      limit: 20
    };

    if (filterContentId.value) {
      queryParams.contentId = filterContentId.value;
    }
    if (filterUserIp.value) {
      queryParams.userIp = filterUserIp.value;
    }

    const { data, error: fetchError } = await useFetch('/api/admin/like/list', {
      server: false,
      query: queryParams
    });
    
    if (fetchError.value) {
      throw fetchError.value;
    }
    
    const response: any = data.value;

    if (response.status === 'success') {
      likes.value = response.likes || [];
      pagination.value = response.pagination;
      contentIdCounts.value = response.contentIdCounts;
      statistics.value = response.statistics;
      currentPage.value = page;

      // 記事情報を一括取得
      const allContentIds = [
        ...contentIdCounts.value.map(item => item.contentId),
        ...likes.value.map(like => like.contentId),
      ];
      await fetchArticles(allContentIds);
    } else {
      error.value = 'いいねの取得に失敗しました';
    }
  } catch (err: any) {
    console.error('Failed to fetch likes:', err);
    if (err.statusCode === 401) {
      error.value = '認証が必要です。再度ログインしてください。';
      setTimeout(() => navigateTo('/admin/signin'), 2000);
    } else {
      error.value = err?.data?.message || 'いいねの取得に失敗しました';
    }
  } finally {
    isLoading.value = false;
  }
};

// ページ変更
const changePage = (page: number) => {
  fetchArticleLike(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// フィルター適用
const applyFilter = () => {
  currentPage.value = 1;
  fetchArticleLike(1);
};

// フィルタークリア
const clearFilter = () => {
  filterContentId.value = '';
  filterUserIp.value = '';
  currentPage.value = 1;
  fetchArticleLike(1);
};

// 人気記事フィルター
const filterByContentId = (contentId: string) => {
  filterContentId.value = contentId;
  filterUserIp.value = '';
  currentPage.value = 1;
  fetchArticleLike(1);
};

// 記事情報を取得
const getArticle = (contentId: string) => {
  return articlesCache.value.get(contentId) || null;
};

// 日付フォーマット
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
};

// 権限チェック（将来的な拡張用）
const canView = computed(() => hasPermission('LIKE_VIEW' as Permission));
const canAdmin = computed(() => hasPermission('LIKE_ADMIN' as Permission));

// 初期化
onMounted(() => {
  fetchArticleLike(1);
});
</script>

<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- ヘッダー -->
      <div class="mb-8">
        <h1 class="text-3xl text-gray-900 mb-2">いいね</h1>
        <p class="text-gray-600">記事に付けられたいいねの情報を確認できます</p>
      </div>

      <!-- 統計情報 -->
      <div v-if="statistics" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="p-4 rounded-xl border-2 border-gray-200 bg-white">
          <div class="flex items-center justify-between">
            <div class="text-left">
              <p class="text-sm text-gray-600">総いいね数</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.totalLikes }}</p>
            </div>
            <div class="p-3 rounded-full bg-pink-100 text-pink-800">
              <Icon name="mdi:heart" class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl border-2 border-gray-200 bg-white">
          <div class="flex items-center justify-between">
            <div class="text-left">
              <p class="text-sm text-gray-600">ユニークユーザー</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.uniqueUsers }}</p>
            </div>
            <div class="p-3 rounded-full bg-blue-100 text-blue-800">
              <Icon name="mdi:account-multiple" class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl border-2 border-gray-200 bg-white">
          <div class="flex items-center justify-between">
            <div class="text-left">
              <p class="text-sm text-gray-600">いいねされた記事数</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.uniqueArticles }}</p>
            </div>
            <div class="p-3 rounded-full bg-green-100 text-green-800">
              <Icon name="mdi:file-document-multiple" class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <!-- 人気記事Top10 -->
      <div v-if="contentIdCounts.length > 0" class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="mdi:chart-bar" class="w-5 h-5 text-primary" />
          人気記事 Top 10
        </h2>
        <div class="space-y-3">
          <button
            v-for="(item, index) in contentIdCounts"
            :key="item.contentId"
            @click="filterByContentId(item.contentId)"
            class="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 text-left"
          >
            <span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
              {{ index + 1 }}
            </span>
            
            <div v-if="getArticle(item.contentId)" class="flex-1 min-w-0">
              <div class="flex items-start gap-3">
                <div class="w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <NuxtImg
                    :src="getArticle(item.contentId)?.eyecatch?.url || useOgGenerator(getArticle(item.contentId)?.title || item.contentId)"
                    :alt="getArticle(item.contentId)?.title || ''"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {{ getArticle(item.contentId)?.title || item.contentId }}
                  </p>
                  <p class="text-xs text-gray-500 truncate">ID: {{ item.contentId }}</p>
                </div>
              </div>
            </div>
            
            <div v-else class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate mb-1">{{ item.contentId }}</p>
              <p class="text-xs text-gray-500">記事情報を取得中...</p>
            </div>
            
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-lg font-bold text-primary">{{ item.count }}</span>
              <Icon name="mdi:heart" class="w-5 h-5 text-pink-500" />
            </div>
          </button>
        </div>
      </div>

      <!-- フィルター -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="mdi:filter" class="w-5 h-5 text-primary" />
          フィルター
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">記事ID</label>
            <input
              v-model="filterContentId"
              type="text"
              placeholder="記事IDで絞り込み"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              @keyup.enter="applyFilter"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ユーザーIP</label>
            <input
              v-model="filterUserIp"
              type="text"
              placeholder="ユーザーIPで絞り込み"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              @keyup.enter="applyFilter"
            />
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            @click="applyFilter"
            class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Icon name="mdi:magnify" class="w-5 h-5" />
            検索
          </button>
          <button
            @click="clearFilter"
            class="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Icon name="mdi:close" class="w-5 h-5" />
            クリア
          </button>
        </div>
      </div>

      <!-- エラーメッセージ -->
      <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="error"
          class="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200"
        >
          <Icon name="mdi:alert-circle" class="w-5 h-5 text-red-600 flex-shrink-0" />
          <p class="text-sm text-red-700 font-medium">{{ error }}</p>
        </div>
      </transition>

      <!-- ローディング -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <Icon name="mdi:loading" class="w-12 h-12 text-gray-400 animate-spin" />
      </div>

      <!-- いいね一覧 -->
      <div v-else-if="likes.length === 0" class="text-center py-12">
        <Icon name="mdi:heart-off-outline" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600">
          {{ filterContentId || filterUserIp ? 'フィルター条件に一致するいいねはありません' : 'いいねはありません' }}
        </p>
      </div>

      <div v-else>
        <!-- 検索結果件数 -->
        <div class="mb-4 text-sm text-gray-600">
          <span v-if="pagination">
            全{{ pagination.totalCount }}件中 {{ (pagination.page - 1) * pagination.limit + 1 }}〜{{ Math.min(pagination.page * pagination.limit, pagination.totalCount) }}件を表示
          </span>
        </div>

        <div class="space-y-4">
          <div
            v-for="like in likes"
            :key="like.id"
            class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <!-- 記事情報がある場合 -->
            <div v-if="getArticle(like.contentId)" class="mb-4">
              <div class="flex gap-4">
                <div class="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <NuxtImg
                    :src="getArticle(like.contentId)?.eyecatch?.url || useOgGenerator(getArticle(like.contentId)?.title || like.contentId)"
                    :alt="getArticle(like.contentId)?.title || ''"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {{ getArticle(like.contentId)?.title }}
                  </h3>
                  <div v-if="getArticle(like.contentId)?.tags" class="flex flex-wrap gap-2 mb-2">
                    <span
                      v-for="tag in getArticle(like.contentId)?.tags?.contents || []"
                      :key="tag.id"
                      class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                    >
                      {{ tag.name }}
                    </span>
                  </div>
                </div>
                <div class="flex-shrink-0">
                  <div class="p-3 rounded-full bg-pink-100">
                    <Icon name="mdi:heart" class="w-6 h-6 text-pink-500" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 記事情報がない場合のフォールバック -->
            <div v-else class="mb-4 flex items-start justify-between">
              <div class="flex-1">
                <p class="text-lg font-bold text-gray-900 mb-2">{{ like.contentId }}</p>
                <p class="text-sm text-gray-500">記事情報を取得できませんでした</p>
              </div>
              <div class="flex-shrink-0 ml-4">
                <div class="p-3 rounded-full bg-pink-100">
                  <Icon name="mdi:heart" class="w-6 h-6 text-pink-500" />
                </div>
              </div>
            </div>

            <div class="border-t border-gray-200 pt-4">
              <!-- 記事ID -->
              <div class="mb-3">
                <div class="flex items-center gap-2 mb-1">
                  <Icon name="mdi:file-document-outline" class="w-4 h-4 text-gray-500" />
                  <span class="text-xs text-gray-500 font-medium">記事ID</span>
                </div>
                <p class="text-sm text-gray-700 ml-6 font-mono">{{ like.contentId }}</p>
              </div>

              <!-- ユーザーIP -->
              <div class="mb-3">
                <div class="flex items-center gap-2 mb-1">
                  <Icon name="mdi:ip" class="w-4 h-4 text-gray-500" />
                  <span class="text-xs text-gray-500 font-medium">ユーザーIP</span>
                </div>
                <p class="text-sm text-gray-700 ml-6 font-mono">{{ like.userIp }}</p>
              </div>

              <!-- 日時情報 -->
              <div class="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                <div class="flex items-center gap-1">
                  <Icon name="mdi:clock-outline" class="w-4 h-4" />
                  <span>作成: {{ formatDate(new Date(like.createdAt).toISOString()) }}</span>
                </div>
              </div>

              <!-- アクションボタン -->
              <NuxtLink
                :to="`/entry/${like.contentId}`"
                target="_blank"
                class="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                title="記事ページを開く"
              >
                <Icon name="mdi:open-in-new" class="w-4 h-4 flex-shrink-0" />
                <span class="whitespace-nowrap">記事を見る</span>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- ページネーション -->
        <MqPagination
          v-if="pagination && pagination.totalPages > 1"
          :total-count="pagination.totalCount"
          :current-page="currentPage"
          :limit="pagination.limit"
          @change="changePage"
        />
      </div>
    </div>
  </div>
</template>
