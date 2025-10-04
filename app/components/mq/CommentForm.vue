<script setup lang="ts">
const props = defineProps<{
  contentId: string;
}>();

const emit = defineEmits<{
  commentSubmitted: [];
}>();

// フォームの状態
const name = ref<string>('');
const comment = ref<string>('');
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// バリデーション
const isNameValid = computed(() => name.value.trim().length > 0 && name.value.trim().length <= 50);
const isCommentValid = computed(() => comment.value.trim().length > 0 && comment.value.trim().length <= 1000);
const isFormValid = computed(() => isNameValid.value && isCommentValid.value);

// 文字数カウント
const nameLength = computed(() => name.value.trim().length);
const commentLength = computed(() => comment.value.trim().length);

// コメント送信
const submitComment = async () => {
  if (!isFormValid.value || isLoading.value) return;

  isLoading.value = true;
  error.value = null;
  successMessage.value = null;

  try {
    const response = await $fetch(`/api/comment/${props.contentId}`, {
      method: 'POST',
      body: {
        name: name.value.trim(),
        comment: comment.value.trim(),
      },
    });

    if (response.status === 'success') {
      successMessage.value = 'コメントを投稿しました。承認されると表示されます。';
      
      // フォームをクリア
      name.value = '';
      comment.value = '';

      // 親コンポーネントに通知
      emit('commentSubmitted');

      // 成功メッセージを5秒後に消す
      setTimeout(() => {
        successMessage.value = null;
      }, 5000);
    } else if (response.status === 'error') {
      error.value = response.message || 'コメントの投稿に失敗しました';

      // エラーメッセージを5秒後に消す
      setTimeout(() => {
        error.value = null;
      }, 5000);
    }
  } catch (err: any) {
    console.error('Failed to submit comment:', err);
    error.value = err?.data?.message || 'コメントの投稿に失敗しました。もう一度お試しください。';

    // エラーメッセージを5秒後に消す
    setTimeout(() => {
      error.value = null;
    }, 5000);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
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
          :disabled="isLoading"
          :class="[
            'px-4 py-2.5 rounded-xl border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/70 backdrop-blur-sm'
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
          :disabled="isLoading"
          :class="[
            'px-4 py-2.5 rounded-xl border transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/70 backdrop-blur-sm'
          ]"
        />
      </div>

      <!-- 送信ボタン -->
      <div class="flex flex-wrap gap-2">
        <button
          type="submit"
          :disabled="!isFormValid || isLoading"
          :class="[
            'group relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl min-w-[120px]',
            isFormValid && !isLoading
              ? 'text-white bg-primary hover:opacity-90 hover:scale-105 focus:ring-primary/20'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed',
            isLoading && 'opacity-75 cursor-wait'
          ]"
        >
          <Icon 
            :name="isLoading ? 'mdi:loading' : 'mdi:send'" 
            :class="[
              'w-5 h-5 flex-shrink-0 transition-transform',
              isLoading && 'animate-spin'
            ]"
          />
          <span class="whitespace-nowrap font-medium">
            {{ isLoading ? '送信中...' : 'コメントを投稿' }}
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
          v-if="error"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200"
        >
          <Icon name="mdi:alert-circle" class="w-4 h-4 text-red-600 flex-shrink-0" />
          <p class="text-sm text-red-700 font-medium">{{ error }}</p>
        </div>
      </transition>
    </form>
  </div>
</template>

