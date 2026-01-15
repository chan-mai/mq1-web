<script setup lang="ts">
const route = useRoute();
const contentId = route.params.contentId as string;
const toast = useToast();
const { saveCommentSecret } = useCommentStorage();

// ステート
const comments = ref<CommentWithReplies[]>([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const page = ref(1);
const hasMore = ref(false);
const totalCount = ref(0);
const formRef = ref<any>(null);

// ツリー再構築ヘルパー
const reconstructTree = (rootId: string, flatDescendants: CommentWithReplies[]): CommentWithReplies[] => {
  if (!flatDescendants || flatDescendants.length === 0) return [];

  const map = new Map<string, CommentWithReplies>();
  const roots: CommentWithReplies[] = [];

  // 1. マップの初期化
  flatDescendants.forEach(c => {
    map.set(c.id, { ...c, replies: [] });
  });

  // 2. 階層構造の構築
  flatDescendants.forEach(original => {
    const c = map.get(original.id)!;
    if (c.parentCommentId === rootId) {
      roots.push(c);
    } else if (c.parentCommentId && map.has(c.parentCommentId)) {
      const parent = map.get(c.parentCommentId)!;
      parent.replies!.push(c);
    } else {
      // Fallback
      if (c.parentCommentId === rootId) {
         roots.push(c);
      }
    }
  });

  // 3. 返信を日付順にソート
  const sortReplies = (list: CommentWithReplies[]) => {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    list.forEach(c => {
      if (c.replies?.length) sortReplies(c.replies);
    });
  };
  
  // ルートを日付順にソート
  roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // ルートの子要素に再帰的なソートを適用
  roots.forEach(root => {
     if (root.replies?.length) sortReplies(root.replies);
  });
  
  return roots;
};

// コメント取得
const fetchComments = async (isLoadMore = false) => {
  isLoading.value = true;
  
  if (!isLoadMore) {
    page.value = 1;
    comments.value = [];
  }

  try {
    const response = await $fetch<any>(`/api/entry/${contentId}/comments`, {
      params: {
        page: page.value,
        limit: 10,
      }
    });

    if (response.status === 'success') {
      const fetchedRoots = response.comments as CommentWithReplies[];
      
      const processedRoots = fetchedRoots.map(root => {
        if (root.replies && root.replies.length > 0) {
           const tree = reconstructTree(root.id, root.replies);
           return { ...root, replies: tree };
        }
        return root;
      });

      if (isLoadMore) {
        comments.value.push(...processedRoots);
      } else {
        comments.value = processedRoots;
      }
      
      totalCount.value = response.overallCount;
      hasMore.value = response.pagination.hasNext;
      if (hasMore.value) {
        page.value++;
      }
    }
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    toast.error({ title: 'コメントの読み込みに失敗しました' });
  } finally {
    isLoading.value = false;
  }
};

// 新規ルートコメントの送信処理
const handleRootSubmit = async (payload: { name: string; comment: string; token: string }) => {
  if (isSubmitting.value) return;
  
  if (!contentId) {
    console.error('Content ID is missing');
    toast.error({ title: 'エラーが発生しました' });
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await $fetch<any>(`/api/entry/${contentId}/comments`, {
      method: 'POST',
      body: {
        name: payload.name,
        comment: payload.comment,
        token: payload.token,
      },
    });

    if (response.status === 'success') {
      if (response.comment.secret) {
        await saveCommentSecret(response.comment.id, response.comment.secret);
      }
      toast.success({ title: 'コメントを投稿しました' });
      formRef.value?.clear();
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchComments(false);
    } else {
      throw new Error(response.message || '投稿に失敗しました');
    }
  } catch (error: any) {
    console.error('Submit error:', error);
    toast.error({ title: error.message || 'コメントの投稿に失敗しました' });
  } finally {
    isSubmitting.value = false;
  }
};

// 返信の送信処理
const handleReply = async (payload: { parentId: string; content: string; name: string; token: string }) => {
  try {
    const response = await $fetch<any>(`/api/entry/${contentId}/comments`, {
      method: 'POST',
      body: {
        name: payload.name,
        comment: payload.content,
        token: payload.token,
        parentCommentId: payload.parentId,
      },
    });

    if (response.status === 'success') {
      if (response.comment.secret) {
        await saveCommentSecret(response.comment.id, response.comment.secret);
      }
      toast.success({ title: '返信を投稿しました' });
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchComments(false);
    } else {
      throw new Error(response.message || '投稿に失敗しました');
    }
  } catch (error: any) {
     console.error('Reply error:', error);
     toast.error({ title: error.message || '返信の投稿に失敗しました' });
  }
};

onMounted(() => {
  fetchComments();
});
</script>

<template>
  <section class="max-w-3xl mx-auto px-4 py-8">
    <div class="flex items-center gap-2 mb-4">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
        <Icon name="lucide:message-square" class="h-4 w-4 text-white" />
      </div>
      <h3 class="text-lg text-primary">コメント</h3>
      <span class="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{{ totalCount }}件</span>
    </div>

    <div class="mb-10">
      <MqCommentForm
        ref="formRef"
        :is-loading="isSubmitting"
        @submit="handleRootSubmit"
      />
    </div>

    <div v-if="isLoading && comments.length === 0" class="space-y-8">
      <div v-for="i in 3" :key="i" class="animate-pulse flex gap-4">
        <div class="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
        <div class="flex-1 space-y-3">
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>

    <!-- コメントリスト -->
    <div class="space-y-8">
      <MqCommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :depth="0"
        @reply="handleReply"
        @updated="fetchComments(false)"
        @deleted="fetchComments(false)"
      />
    </div>

    <!-- さらに読み込む -->
    <div v-if="hasMore" class="mt-8 text-center border-t border-gray-100 pt-8">
      <button
        @click="fetchComments(true)"
        :disabled="isLoading"
        class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors border border-gray-200"
      >
        <Icon v-if="isLoading" name="mdi:loading" class="w-4 h-4 animate-spin" />
        <Icon v-else name="lucide:chevron-down" class="w-4 h-4" />
        <span>さらに読み込む</span>
      </button>
    </div>
    
    <!-- 空の状態 -->
    <div v-if="!isLoading && comments.length === 0" class="text-center py-12 text-gray-500">
       <div class="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
         <Icon name="mdi:comment-outline" class="w-8 h-8 text-gray-400" />
       </div>
       <p>まだコメントはありません。<br>最初のコメントを投稿してみましょう！</p>
    </div>
  </section>
</template>
