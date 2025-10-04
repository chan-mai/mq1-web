<script setup lang="ts">
import { Avatar } from '@boringer-avatars/vue3';

const props = defineProps<{
  contentId: string;
}>();

interface Comment {
  id: string;
  name: string;
  comment: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// コメント一覧
const comments = ref<Comment[]>([]);
const pagination = ref<Pagination | null>(null);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);
const currentPage = ref<number>(1);

// コメント一覧を取得
const fetchComments = async (page: number = 1) => {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await $fetch(`/api/comment/${props.contentId}?page=${page}&limit=10`);

    if (response.status === 'success') {
      comments.value = response.comments;
      pagination.value = response.pagination;
      currentPage.value = page;
    } else {
      error.value = 'コメントの取得に失敗しました';
    }
  } catch (err) {
    console.error('Failed to fetch comments:', err);
    error.value = 'コメントの取得に失敗しました';
  } finally {
    isLoading.value = false;
  }
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

// ページ変更
const changePage = (page: number) => {
  if (page < 1 || (pagination.value && page > pagination.value.totalPages)) return;
  fetchComments(page);
  // スクロール位置をコメントセクションに移動
  const element = document.getElementById('comments-section');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

// 初期化
onMounted(() => {
  fetchComments(1);
});

// 外部から更新できるようにする
defineExpose({
  refresh: () => fetchComments(currentPage.value),
});
</script>

<template>
  <div id="comments-section" class="flex flex-col gap-3 rounded-xl px-5 py-4">
    <!-- ローディング -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <Icon name="mdi:loading" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <!-- エラー -->
    <div
      v-else-if="error"
      class="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200"
    >
      <Icon name="mdi:alert-circle" class="w-5 h-5 text-red-600 flex-shrink-0" />
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <!-- コメントなし -->
    <div
      v-else-if="comments.length === 0"
      class="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-gray-50 border border-gray-200"
    >
      <Icon name="mdi:comment-off-outline" class="w-12 h-12 text-gray-400 mb-2" />
      <p class="text-gray-600">まだコメントがありません</p>
      <p class="text-sm text-gray-500">最初のコメントを投稿してみましょう！</p>
    </div>

    <!-- コメント一覧 -->
    <div v-else class="flex flex-col gap-3">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="flex flex-col gap-2 px-4 py-3 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200/60"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Avatar 
              :name="comment.name" 
              variant="beam"
              :size="32"
              :square="false"
              class="flex-shrink-0"
            />
            <span class="font-medium text-gray-800">{{ comment.name }}</span>
          </div>
          <time class="text-xs text-gray-500" :datetime="comment.createdAt">
            {{ formatDate(comment.createdAt) }}
          </time>
        </div>
        <p class="text-gray-700 whitespace-pre-wrap break-words pl-10">{{ comment.comment }}</p>
      </div>
    </div>

    <!-- ページネーション -->
    <div
      v-if="pagination && pagination.totalPages > 1"
      class="flex items-center justify-center gap-2 mt-4"
    >
      <button
        @click="changePage(currentPage - 1)"
        :disabled="!pagination.hasPrev"
        :class="[
          'p-2 rounded-lg transition-all duration-200',
          pagination.hasPrev
            ? 'text-gray-700 bg-white/70 hover:bg-gray-100 border border-gray-200'
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
            'min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium',
            page === currentPage
              ? 'bg-purple-500 text-white'
              : 'text-gray-700 bg-white/70 hover:bg-gray-100 border border-gray-200'
          ]"
        >
          {{ page }}
        </button>
      </div>

      <button
        @click="changePage(currentPage + 1)"
        :disabled="!pagination.hasNext"
        :class="[
          'p-2 rounded-lg',
          pagination.hasNext
            ? 'text-gray-700 bg-white/70 hover:bg-gray-100 border border-gray-200'
            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
        ]"
        aria-label="次のページ"
      >
        <Icon name="mdi:chevron-right" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

