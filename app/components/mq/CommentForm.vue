<script setup lang="ts">
const props = defineProps<{
  isLoading: boolean;
  replyToName?: string | null;
  initialComment?: string;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: { name: string; comment: string; token: string }): void;
  (e: 'cancel'): void;
}>();

const name = ref('');
const comment = ref(props.initialComment || '');
const turnstile = ref();
const isPolicyExpanded = ref(false);

// バリデーション
const isNameValid = computed(() => name.value.trim().length > 0 && name.value.trim().length <= 50);
const isCommentValid = computed(() => comment.value.trim().length > 0 && comment.value.trim().length <= 1000);
const isFormValid = computed(() => isNameValid.value && isCommentValid.value);

// 文字数カウント
const nameLength = computed(() => name.value.trim().length);
const commentLength = computed(() => comment.value.trim().length);

const onSubmit = () => {
  if (!isFormValid.value || props.isLoading) return;
  emit('submit', {
    name: name.value.trim(),
    comment: comment.value.trim(),
    token: turnstile.value,
  });
};

// フォームのクリア（親から呼び出せるようにexpose）
const clear = () => {
  name.value = '';
  comment.value = '';
  if (turnstile.value) {
    turnstile.value.reset(); // Turnstileのリセットメソッドがあれば
  }
};

defineExpose({ clear, name, comment });
</script>

<template>
  <div class="flex flex-col gap-3 px-5 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <Icon :name="replyToName ? 'lucide:reply' : 'mdi:comment-edit-outline'" class="h-4 w-4 text-white" />
        </div>
        <h3 class="text-lg text-primary font-medium">
          {{ replyToName ? `${replyToName}さんへ返信` : 'コメントを投稿' }}
        </h3>
      </div>
      <!-- キャンセルボタン（返信時のみ） -->
      <button 
        v-if="replyToName"
        @click="$emit('cancel')"
        type="button"
        class="text-sm text-gray-500 hover:text-gray-700 transition-colors border-none"
      >
        <Icon name="lucide:x" class="w-5 h-5" />
      </button>
    </div>

    <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
      <!-- 名前入力 -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700" for="reply-name">
          お名前
          <span class="text-red-500 ml-1">*</span>
          <span class="text-xs text-gray-500 ml-2">{{ nameLength }}/50</span>
        </label>
        <input
          id="reply-name" 
          v-model="name"
          type="text"
          placeholder="お名前を入力してください"
          maxlength="50"
          required
          :disabled="isLoading"
          :class="[
            'px-4 py-2.5 rounded-xl border border-gray-200 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          ]"
        />
      </div>

      <!-- コメント入力 -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700" for="reply-comment">
          コメント
          <span class="text-red-500 ml-1">*</span>
          <span class="text-xs text-gray-500 ml-2">{{ commentLength }}/1000</span>
        </label>
        <textarea
          id="reply-comment"
          v-model="comment"
          placeholder="コメントを入力してください"
          rows="4"
          maxlength="1000"
          required
          autofocus
          :disabled="isLoading"
          :class="[
            'px-4 py-2.5 rounded-xl border border-gray-200 transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
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
          :disabled="!isFormValid || isLoading"
          :class="[
            'group relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl min-w-[120px]',
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
            {{ isLoading ? '送信中...' : (replyToName ? '返信を投稿' : 'コメントを投稿') }}
          </span>
        </button>
      </div>

      <!-- コメントポリシー注意事項 -->
      <div class="rounded-lg bg-primary/5 border border-primary overflow-hidden">
        <button
          type="button"
          @click="isPolicyExpanded = !isPolicyExpanded"
          class="w-full flex items-center justify-between px-4 py-3 border-none hover:bg-primary/10 transition-colors duration-200"
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
</template>
