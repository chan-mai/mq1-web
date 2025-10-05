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
const isLoadingList = ref<boolean>(false);
const listError = ref<string | null>(null);
const currentPage = ref<number>(1);

// フォームの状態
const name = ref<string>('');
const comment = ref<string>('');
const isLoadingForm = ref<boolean>(false);
const formError = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const turnstile = ref();

// 注意事項の折りたたみ状態
const isPolicyExpanded = ref<boolean>(false);

// バリデーション
const isNameValid = computed(() => name.value.trim().length > 0 && name.value.trim().length <= 50);
const isCommentValid = computed(() => comment.value.trim().length > 0 && comment.value.trim().length <= 1000);
const isFormValid = computed(() => isNameValid.value && isCommentValid.value);

// 文字数カウント
const nameLength = computed(() => name.value.trim().length);
const commentLength = computed(() => comment.value.trim().length);

// コメント一覧を取得
const fetchComments = async (page: number = 1) => {
  isLoadingList.value = true;
  listError.value = null;

  try {
    const response = await $fetch(`/api/comment/${props.contentId}?page=${page}&limit=10`);

    if (response.status === 'success') {
      comments.value = response.comments;
      pagination.value = response.pagination;
      currentPage.value = page;
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

// コメント送信
const submitComment = async () => {
  if (!isFormValid.value || isLoadingForm.value) return;

  isLoadingForm.value = true;
  formError.value = null;
  successMessage.value = null;

  try {
    const response = await $fetch(`/api/comment/${props.contentId}`, {
      method: 'POST',
      body: {
        name: name.value.trim(),
        comment: comment.value.trim(),
        token: turnstile.value,
      },
    });

    if (response.status === 'success') {
      successMessage.value = 'コメントを投稿しました。承認されると表示されます。';
      
      // フォームをクリア
      name.value = '';
      comment.value = '';

      // 成功メッセージを5秒後に消す
      setTimeout(() => {
        successMessage.value = null;
      }, 5000);

      // コメント一覧を更新
      await fetchComments(currentPage.value);
    } else if (response.status === 'error') {
      formError.value = response.message || 'コメントの投稿に失敗しました';

      // エラーメッセージを5秒後に消す
      setTimeout(() => {
        formError.value = null;
      }, 5000);
    }
  } catch (err: any) {
    console.error('Failed to submit comment:', err);
    formError.value = err?.data?.message || 'コメントの投稿に失敗しました。もう一度お試しください。';

    // エラーメッセージを5秒後に消す
    setTimeout(() => {
      formError.value = null;
    }, 5000);
  } finally {
    isLoadingForm.value = false;
  }
};

// 初期化
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
          <span v-if="pagination" class="text-sm text-gray-500 ml-2">
            ({{ pagination.totalCount }}件)
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
          class="flex flex-col gap-2 px-4 py-3 rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200/60"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Avatar 
                :name="commentItem.name" 
                variant="beam"
                :size="32"
                :square="false"
                class="flex-shrink-0"
              />
              <span class="font-medium text-gray-800">{{ commentItem.name }}</span>
            </div>
            <time class="text-xs text-gray-500" :datetime="commentItem.createdAt">
              {{ formatDate(commentItem.createdAt) }}
            </time>
          </div>
          <p class="text-gray-700 whitespace-pre-wrap break-words pl-10">{{ commentItem.comment }}</p>
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
              'min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              page === currentPage
                ? 'bg-primary text-white shadow-md'
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
            'p-2 rounded-lg transition-all duration-200',
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

    <!-- コメント投稿フォーム -->
    <div class="flex flex-col gap-3 rounded-xl px-5 py-4">
      <div class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <Icon name="mdi:comment-edit-outline" class="h-4 w-4 text-white" />
        </div>
        <h3 class="text-lg text-primary">コメントを投稿</h3>
      </div>

      <form @submit.prevent="submitComment" class="flex flex-col gap-4">
        <!-- 名前入力 -->
        <div class="flex flex-col gap-2">
          <label for="comment-name" class="text-sm font-medium text-gray-700">
            お名前
            <span class="text-red-500 ml-1">*</span>
            <span class="text-xs text-gray-500 ml-2">{{ nameLength }}/50</span>
          </label>
          <input
            id="comment-name"
            v-model="name"
            type="text"
            placeholder="お名前を入力してください"
            maxlength="50"
            required
            :disabled="isLoadingForm"
            :class="[
              'px-4 py-2.5 rounded-xl border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              isLoadingForm ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/70 backdrop-blur-sm'
            ]"
          />
        </div>

        <!-- コメント入力 -->
        <div class="flex flex-col gap-2">
          <label for="comment-content" class="text-sm font-medium text-gray-700">
            コメント
            <span class="text-red-500 ml-1">*</span>
            <span class="text-xs text-gray-500 ml-2">{{ commentLength }}/1000</span>
          </label>
          <textarea
            id="comment-content"
            v-model="comment"
            placeholder="コメントを入力してください"
            rows="4"
            maxlength="1000"
            required
            :disabled="isLoadingForm"
            :class="[
              'px-4 py-2.5 rounded-xl border transition-all duration-200 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              isLoadingForm ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/70 backdrop-blur-sm'
            ]"
          />
        </div>

        <!-- Turnstile -->
        <div>
          <NuxtTurnstile v-model="turnstile" />
        </div>

        <!-- 送信ボタン -->
        <div class="flex flex-wrap gap-2">
          <button
            type="submit"
            :disabled="!isFormValid || isLoadingForm"
            :class="[
              'group relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl min-w-[120px]',
              isFormValid && !isLoadingForm
                ? 'text-white bg-primary hover:opacity-90 hover:scale-105 focus:ring-primary/20'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed',
              isLoadingForm && 'opacity-75 cursor-wait'
            ]"
          >
            <Icon 
              :name="isLoadingForm ? 'mdi:loading' : 'mdi:send'" 
              :class="[
                'w-5 h-5 flex-shrink-0 transition-transform',
                isLoadingForm && 'animate-spin'
              ]"
            />
            <span class="whitespace-nowrap font-medium">
              {{ isLoadingForm ? '送信中...' : 'コメントを投稿' }}
            </span>
          </button>
        </div>

        <!-- 成功メッセージ -->
        <transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div
            v-if="successMessage"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200"
          >
            <Icon name="mdi:check-circle" class="w-4 h-4 text-green-600 flex-shrink-0" />
            <p class="text-sm text-green-700 font-medium">{{ successMessage }}</p>
          </div>
        </transition>

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
            v-if="formError"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200"
          >
            <Icon name="mdi:alert-circle" class="w-4 h-4 text-red-600 flex-shrink-0" />
            <p class="text-sm text-red-700 font-medium">{{ formError }}</p>
          </div>
        </transition>

        <!-- コメントポリシー注意事項 -->
        <div class="rounded-lg bg-primary/5 border border-primary overflow-hidden">
          <!-- ヘッダー（クリック可能） -->
          <button
            type="button"
            @click="isPolicyExpanded = !isPolicyExpanded"
            class="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/10 transition-colors duration-200"
          >
            <div class="flex items-center gap-2">
              <Icon name="mdi:information-outline" class="w-5 h-5 text-primary flex-shrink-0" />
              <p class="text-sm font-semibold text-primary">注意事項</p>
            </div>
            <Icon 
              :name="isPolicyExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
              class="w-5 h-5 text-primary transition-transform duration-200"
            />
          </button>
          
          <!-- 折りたたみ可能なコンテンツ -->
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-96 opacity-100"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="max-h-96 opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-show="isPolicyExpanded" class="overflow-hidden">
              <div class="px-4 pb-3 pt-1">
                <div class="text-xs text-gray-500 space-y-2">
                  <p class="leading-relaxed">
                    このサイトでは「自分が何者であるかを明確にする」ことに重きを置いています。したがって、基本的にはSNSアカウントなどで利用しているIDを記入することを推奨します。<br />名前だけであなたが何者であるかを明らかにできる場合は、実名の使用も歓迎します。
                  </p>
                  <p class="leading-relaxed text-primary">
                    ⚠️ この機能は、コメントの責任の所在を明らかにする意思を問うものであり、真偽を検証する機能はありません。ただし、明らかに偽りや無効な名前、不適切な内容が含まれる場合、そのコメントは削除される可能性があります。
                  </p>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </form>
    </div>
  </div>
</template>
