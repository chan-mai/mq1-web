<script setup lang="ts">
import Avatar from "vue-boring-avatars";
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '#shared/types/microccms';
import type { Permission, CommentStatus } from '../../../generated/prisma/enums';
import type { Comments } from '../../../generated/prisma/browser';

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  ssr: false
});

const { hasPermission } = useAdminPermissions();
const toast = useToast();

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface StatusCount {
  status: string;
  count: number;
}

// メタタグ設定
useHead({
  title: 'Admin Console - コメント',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
});

// 状態管理
const comments = ref<Comments[]>([]);
const pagination = ref<Pagination | null>(null);
const statusCounts = ref<StatusCount[]>([]);
const isLoading = ref<boolean>(false);

// 記事情報のキャッシュ
const articlesCache = ref<Map<string, MicroCMSObject<Article> | null>>(new Map());

// フィルター
const selectedStatus = ref<string>('');
const currentPage = ref<number>(1);

const client = useMicroCMSClient();

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

// コメント一覧を取得
const fetchComments = async (page: number = 1) => {
  isLoading.value = true;

  try {
    const url = selectedStatus.value
      ? `/api/admin/comment/list?status=${selectedStatus.value}&page=${page}&limit=20`
      : `/api/admin/comment/list?page=${page}&limit=20`;

    const { data, error: fetchError } = await useFetch(url, { server: false });
    
    if (fetchError.value) {
      throw fetchError.value;
    }
    
    const response = data.value as { status: string; comments: Comments[]; pagination: Pagination; statusCounts: StatusCount[] };

    if (response.status === 'success') {
      comments.value = response.comments;
      pagination.value = response.pagination;
      statusCounts.value = response.statusCounts;
      currentPage.value = page;

      // 記事情報を一括取得
      const contentIds = comments.value.map(comment => comment.contentId);
      await fetchArticles(contentIds);
    } else {
      toast.error({
        title: 'コメントの取得に失敗しました',
      });
    }
  } catch (err: any) {
    console.error('Failed to fetch comments:', err);
    if (err.statusCode === 401) {
      toast.error({
        title: '認証が必要です。再度ログインしてください。',
      });
      // 認証エラーの場合はログインページにリダイレクト
      setTimeout(() => navigateTo('/admin/signin'), 2000);
    } else {
      toast.error({
        title: err?.data?.message || 'コメントの取得に失敗しました',
      });
    }
  } finally {
    isLoading.value = false;
  }
};

// コメントのステータスを更新
const updateCommentStatus = async (commentId: string, status: CommentStatus) => {
  try {
    const response: any = await $fetch(`/api/admin/comment/${commentId}`, {
      method: 'PATCH',
      body: { status }
    });

    if (response.status === 'success') {
      toast.success({
        title: `コメントを${status === 'APPROVED' ? '承認' : status === 'REJECTED' ? '拒否' : '保留に'}しました`,
      });
      
      // リストを再読み込み
      await fetchComments(currentPage.value);
    } else {
      toast.error({
        title: response.message || 'ステータスの更新に失敗しました',
      });
    }
  } catch (err: any) {
    console.error('Failed to update comment status:', err);
    toast.error({
      title: err?.data?.message || 'ステータスの更新に失敗しました',
    });
  }
};

// コメントを削除
const deleteComment = async (commentId: string) => {
  if (!confirm('このコメントを削除してもよろしいですか？')) {
    return;
  }

  try {
    const response: any = await $fetch(`/api/admin/comment/${commentId}`, {
      method: 'DELETE'
    });

    if (response.status === 'success') {
      toast.success({
        title: 'コメントを削除しました',
      });
      
      // リストを再読み込み
      await fetchComments(currentPage.value);
    } else {
      toast.error({
        title: response.message || 'コメントの削除に失敗しました',
      });
    }
  } catch (err: any) {
    console.error('Failed to delete comment:', err);
    toast.error({
      title: err?.data?.message || 'コメントの削除に失敗しました',
    });
  }
};

// ページ変更
const changePage = (page: number) => {
  if (page < 1 || (pagination.value && page > pagination.value.totalPages)) return;
  fetchComments(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// フィルター変更
const changeStatusFilter = (status: string) => {
  selectedStatus.value = status;
  currentPage.value = 1;
  fetchComments(1);
};

// 日付フォーマット
const formatDate = (dateString: string | Date): string => {
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

// ステータス表示用のヘルパー
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return '承認待ち';
    case 'APPROVED':
      return '承認済み';
    case 'REJECTED':
      return '拒否';
    default:
      return status;
  }
};

// 記事情報を取得
const getArticle = (contentId: string) => {
  return articlesCache.value.get(contentId) || null;
};

// 権限チェック
const canAdmin = computed(() => hasPermission('COMMENT_ADMIN' as Permission));

// 初期化
onMounted(() => {
  fetchComments(1);
});
</script>

<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- ヘッダー -->
      <div class="mb-8">
        <h1 class="text-3xl text-gray-900 mb-2">コメント</h1>
        <p class="text-gray-600">投稿されたコメントの承認・拒否・削除を行えます</p>
      </div>

      <!-- ステータスカウント -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <button
          v-for="statusCount in statusCounts"
          :key="statusCount.status"
          @click="changeStatusFilter(selectedStatus === statusCount.status ? '' : statusCount.status)"
          :class="[
            'p-4 rounded-xl border-2 transition-all duration-200',
            selectedStatus === statusCount.status
              ? 'border-primary bg-primary/10 shadow-md'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="text-left">
              <p class="text-sm text-gray-600">{{ getStatusLabel(statusCount.status) }}</p>
              <p class="text-2xl font-bold text-gray-900">{{ statusCount.count }}</p>
            </div>
            <div :class="['p-3 rounded-full', getStatusColor(statusCount.status)]">
              <Icon 
                :name="statusCount.status === 'PENDING' ? 'mdi:clock-outline' : statusCount.status === 'APPROVED' ? 'mdi:check-circle' : 'mdi:close-circle'" 
                class="w-6 h-6"
              />
            </div>
          </div>
        </button>
      </div>

      <!-- ローディング -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <Icon name="mdi:loading" class="w-12 h-12 text-gray-400 animate-spin" />
      </div>

      <!-- コメント一覧 -->
      <div v-else-if="comments.length === 0" class="text-center py-12">
        <Icon name="mdi:comment-off-outline" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600">
          {{ selectedStatus ? `${getStatusLabel(selectedStatus)}のコメントはありません` : 'コメントはありません' }}
        </p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <!-- 記事情報 -->
          <div v-if="getArticle(comment.contentId)" class="mb-4 pb-4 border-b border-gray-200">
            <div class="flex gap-3">
              <div class="w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <NuxtImg
                  :src="getArticle(comment.contentId)?.eyecatch?.url || useOgGenerator(getArticle(comment.contentId)?.title || comment.contentId)"
                  :alt="getArticle(comment.contentId)?.title || ''"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                  {{ getArticle(comment.contentId)?.title }}
                </p>
                <p class="text-xs text-gray-500">ID: {{ comment.contentId }}</p>
              </div>
            </div>
          </div>

          <!-- コメントヘッダー -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <Avatar 
                :name="comment.name" 
                variant="beam"
                :size="40"
                :square="false"
                class="flex-shrink-0"
              />
              <div>
                <p class="font-medium text-gray-900">{{ comment.name }}</p>
                <p class="text-xs text-gray-500">{{ comment.userIp }}</p>
              </div>
            </div>
            <span :class="['px-3 py-1 rounded-full text-xs font-medium border', getStatusColor(comment.status)]">
              {{ getStatusLabel(comment.status) }}
            </span>
          </div>

          <!-- コメント本文 -->
          <div class="mb-4">
            <p class="text-gray-700 whitespace-pre-wrap break-words">{{ comment.comment }}</p>
          </div>

          <!-- メタ情報 -->
          <div class="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
            <div v-if="!getArticle(comment.contentId)" class="flex items-center gap-1">
              <Icon name="mdi:file-document-outline" class="w-4 h-4" />
              <span>記事ID: {{ comment.contentId }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Icon name="mdi:clock-outline" class="w-4 h-4" />
              <span>投稿: {{ formatDate(comment.createdAt) }}</span>
            </div>
            <div v-if="comment.createdAt !== comment.updatedAt" class="flex items-center gap-1">
              <Icon name="mdi:update" class="w-4 h-4" />
              <span>更新: {{ formatDate(comment.updatedAt) }}</span>
            </div>
          </div>

          <!-- アクションボタン -->
          <div v-if="canAdmin" class="flex flex-wrap gap-2">
            <button
              v-if="comment.status !== 'APPROVED'"
              @click="updateCommentStatus(comment.id, 'APPROVED')"
              class="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-lime-500 hover:bg-lime-600 rounded-lg transition-colors duration-200 min-w-[80px]"
              title="コメントを承認"
            >
              <Icon name="mdi:check" class="w-4 h-4 flex-shrink-0" />
              <span>承認</span>
            </button>
            
            <button
              v-if="comment.status !== 'REJECTED'"
              @click="updateCommentStatus(comment.id, 'REJECTED')"
              class="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors duration-200 min-w-[80px]"
              title="コメントを拒否"
            >
              <Icon name="mdi:close" class="w-4 h-4 flex-shrink-0" />
              <span>拒否</span>
            </button>
            
            <button
              v-if="comment.status !== 'PENDING'"
              @click="updateCommentStatus(comment.id, 'PENDING')"
              class="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors duration-200 min-w-[100px]"
              title="承認待ちに戻す"
            >
              <Icon name="mdi:clock-outline" class="w-4 h-4 flex-shrink-0" />
              <span class="whitespace-nowrap">保留に戻す</span>
            </button>
            
            <button
              @click="deleteComment(comment.id)"
              class="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200 min-w-[80px]"
              title="コメントを削除"
            >
              <Icon name="mdi:delete" class="w-4 h-4 flex-shrink-0" />
              <span>削除</span>
            </button>

            <NuxtLink
              :to="`/entry/${comment.contentId}`"
              target="_blank"
              class="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 min-w-[100px]"
              title="記事ページを開く"
            >
              <Icon name="mdi:open-in-new" class="w-4 h-4 flex-shrink-0" />
              <span class="whitespace-nowrap">記事を見る</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- ページネーション -->
      <div
        v-if="pagination && pagination.totalPages > 1"
        class="flex items-center justify-center gap-2 mt-8"
      >
        <button
          @click="changePage(currentPage - 1)"
          :disabled="!pagination.hasPrev"
          :class="[
            'p-2 rounded-lg transition-all duration-200',
            pagination.hasPrev
              ? 'text-gray-700 bg-white hover:bg-gray-100 border border-gray-200'
              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          ]"
          aria-label="前のページ"
        >
          <Icon name="mdi:chevron-left" class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="page in pagination.totalPages"
            :key="page"
            @click="changePage(page)"
            :class="[
              'min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              page === currentPage
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-700 bg-white hover:bg-gray-100 border border-gray-200'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="!pagination.hasNext"
          :class="[
            'p-2 rounded-lg transition-all duration-200',
            pagination.hasNext
              ? 'text-gray-700 bg-white hover:bg-gray-100 border border-gray-200'
              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          ]"
          aria-label="次のページ"
        >
          <Icon name="mdi:chevron-right" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

