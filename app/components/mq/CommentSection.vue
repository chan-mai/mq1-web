<script lang="ts" setup>
const props = defineProps<{
  contentId: string;
}>();

const toast = useToast();

// コメント一覧
const comments = ref<CommentWithReplies[]>([]);
const pagination = ref<CommentsPagination | null>(null);
const isLoadingList = ref<boolean>(false);
const listError = ref<string | null>(null);
const currentPage = ref<number>(1);
const overallCount = ref<number>(0);

// 返信フォームの状態
const replyingToId = ref<string | null>(null);
const replyingToName = ref<string | null>(null);

// フォームの状態（ローディングのみ親で管理）
const isLoadingForm = ref<boolean>(false);

// コメント一覧を取得
const fetchComments = async (page: number = 1) => {
  isLoadingList.value = true;
  listError.value = null;

  try {
    const response = await $fetch<{ status: string; comments: CommentWithReplies[]; pagination: CommentsPagination }>(`/api/comment/${props.contentId}?page=${page}&limit=10`);

    if (response.status === 'success') {
      comments.value = response.comments;
      pagination.value = response.pagination;
      currentPage.value = page;
      overallCount.value = response.pagination.totalCount;
    } else {
      listError.value = 'コメントの取得に失敗しました';
    }
  } catch (err) {
    console.error('Failed to fetch comments:', err);
    listError.value = 'コメントの取得に失敗しました';
  } finally {
    isLoadingList.value = false;
  }
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

// ページ変更
const changePage = (page: number) => {
  fetchComments(page);
  // スクロール位置をコメントセクションに移動
  const element = document.getElementById('comments-section');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

// 返信開始
const startReply = (commentItem: CommentWithReplies) => {
  // ネストされたコメントへの返信も、そのコメントIDを親IDとして設定する
  replyingToId.value = commentItem.id;
  replyingToName.value = commentItem.name;
};

// 返信キャンセル
const cancelReply = () => {
  replyingToId.value = null;
  replyingToName.value = null;
};

// コメント送信
const submitComment = async (payload: { name: string; comment: string; token: string }) => {
  if (isLoadingForm.value) return;

  isLoadingForm.value = true;

  try {
    const body: any = {
      name: payload.name,
      comment: payload.comment,
      token: payload.token,
    };

    if (replyingToId.value) {
      body.parentCommentId = replyingToId.value;
    }

    const response = await $fetch(`/api/comment/${props.contentId}`, {
      method: 'POST',
      body,
    });

    if (response.status === 'success') {
      useTrackEvent('comment_added', { contentId: props.contentId, isReply: !!replyingToId.value });
      toast.success({
        title: replyingToId.value ? '返信を投稿しました。' : 'コメントを投稿しました。',
        message: '承認されると表示されます。',
      });
      
      // 返信状態をリセット
      replyingToId.value = null;
      replyingToName.value = null;

      // コメント一覧を更新
      await fetchComments(currentPage.value);
    } else if (response.status === 'error') {
      toast.error({
        title: '投稿に失敗しました',
        message: response.message || undefined,
      });
    }
  } catch (err: any) {
    console.error('Failed to submit comment:', err);
    toast.error({
      title: '投稿に失敗しました。もう一度お試しください。',
    });
  } finally {
    isLoadingForm.value = false;
  }
};

onMounted(() => {
  fetchComments(1);
});
</script>

<template>
  <div id="comments-section" class="flex flex-col gap-6">
    <!-- コメント一覧 -->
    <div class="flex flex-col gap-3 rounded-xl px-5 py-4">
      <div class="flex items-center gap-2 mb-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <Icon name="mdi:comment-multiple-outline" class="h-4 w-4 text-white" />
        </div>
        <h3 class="text-lg text-primary">
          コメント
          <span v-if="overallCount !== undefined" class="text-sm text-gray-500 ml-2">
            ({{ overallCount }}件)
          </span>
        </h3>
      </div>

      <!-- ローディング -->
      <div v-if="isLoadingList" class="flex justify-center py-8">
        <Icon name="mdi:loading" class="w-8 h-8 text-gray-400 animate-spin" />
      </div>

      <!-- エラー -->
      <div
        v-else-if="listError"
        class="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200"
      >
        <Icon name="mdi:alert-circle" class="w-5 h-5 text-red-600 flex-shrink-0" />
        <p class="text-sm text-red-700">{{ listError }}</p>
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
          v-for="commentItem in comments"
          :key="commentItem.id"
          class="flex flex-col gap-2"
        >
          <!-- ルートコメント（再帰コンポーネントの起点） -->
          <MqCommentItem 
            :comment="commentItem"
            :depth="0"
            :replying-to-id="replyingToId"
            :replying-to-name="replyingToName"
            :is-loading-form="isLoadingForm"
            @reply="startReply"
            @submit="submitComment"
            @cancel="cancelReply"
          />
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

    <!-- コメント投稿フォーム（返信中でない場合のみ表示） -->
    <MqCommentForm 
      v-if="!replyingToId" 
      :is-loading="isLoadingForm" 
      @submit="submitComment"
    />
  </div>
</template>
