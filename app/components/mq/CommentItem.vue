<script setup lang="ts">
import Avatar from 'vue-boring-avatars';

defineOptions({
  name: 'MqCommentItem'
});

const props = defineProps<{
  comment: CommentWithReplies;
  isLast?: boolean; // 親から見て最後の要素かどうか
  depth?: number;   // 階層の深さ（インデント制御用）
  replyingToId: string | null;
  replyingToName: string | null;
  isLoadingForm: boolean;
}>();

const emit = defineEmits<{
  (e: 'reply', comment: CommentWithReplies): void;
  (e: 'submit', payload: any): void;
  (e: 'cancel'): void;
}>();

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

const handleReply = (target: CommentWithReplies) => {
  emit('reply', target);
};
</script>

<template>
  <div class="relative">


    <!-- コメント本体 -->
    <div 
      :id="`comment-${comment.id}`"
      class="relative z-10 flex flex-col gap-2 px-4 py-3 rounded-xl bg-white/50 border-2 border-gray-100 transition-all duration-200 hover:bg-white hover:border-primary/50 mb-3 ml-2 group"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Avatar 
            :name="comment.name" 
            variant="beam"
            :size="32"
            :square="false"
            class="flex-shrink-0 ring-2 ring-primary/50 rounded-full"
          />
          <div class="flex flex-col leading-none gap-1">
            <span class="font-bold text-sm text-gray-800">{{ comment.name }}</span>
            <time class="text-[10px] text-gray-400 font-medium" :datetime="comment.createdAt.toString()">
              {{ formatDate(comment.createdAt) }}
            </time>
          </div>
        </div>
      </div>
      <!-- アバター(32px) + gap(12px) = 44px -->
      <p class="text-sm text-gray-700 whitespace-pre-wrap break-words pl-[44px] leading-relaxed">
        <span v-if="comment.parent" class="text-primary font-bold mr-1 select-none">@{{ comment.parent.name }}</span>
        <span>{{ comment.comment }}</span>
      </p>

      <!-- 返信ボタン -->
      <div class="flex justify-end mt-1">
        <button 
          @click="handleReply(comment)"
          class="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-gray-400 hover:text-primary hover:bg-primary/5 transition-all outline-none"
          title="返信する"
        >
          <Icon name="lucide:reply" class="w-3.5 h-3.5" />
          <span>返信</span>
        </button>
      </div>

      <!-- 返信フォーム（このコメントへの返信時のみ表示） -->
      <div v-if="replyingToId === comment.id" class="mt-3 pl-[44px]" @click.stop>
        <MqCommentForm 
          :is-loading="isLoadingForm" 
          :reply-to-name="replyingToName"
          @submit="(payload) => emit('submit', payload)"
          @cancel="emit('cancel')"
        />
      </div>
    </div>

    <!-- 子コメントコンテナ（再帰表示） -->
    <div 
      v-if="comment.replies && comment.replies.length > 0" 
      class="flex flex-col relative"
      :class="{ 
        'mt-2 pl-4 md:pl-8 ml-3 md:ml-5 border-l-2 border-gray-200': (depth || 0) === 0,
        'mt-2': (depth || 0) > 0
      }"
    >
      <MqCommentItem
        v-for="(reply, index) in comment.replies"
        :key="reply.id"
        :comment="reply"
        :is-last="index === comment.replies.length - 1"
        :depth="(depth || 0) + 1"
        :replying-to-id="replyingToId"
        :replying-to-name="replyingToName"
        :is-loading-form="isLoadingForm"
        @reply="(t) => emit('reply', t)"
        @submit="(p) => emit('submit', p)"
        @cancel="emit('cancel')"
      />
    </div>
  </div>
</template>
