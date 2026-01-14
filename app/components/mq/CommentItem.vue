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

const parsedComment = computed(() => {
  const text = props.comment.comment || '';
  // @で始まり、空白(半角/全角)か改行で終わる、または文字列末尾までの部分を抽出
  const regex = /(@[^\s \n]+)/g;
  return text.split(regex).map(part => ({
    text: part,
    isMention: part.startsWith('@') && part.length > 1
  }));
});
</script>

<template>
  <div class="relative">
    <!-- スレッド接続線（曲線） -->
    <template v-if="depth && depth > 0">
      <!-- カーブして自分につながる線 -->
      <!-- Vertical Line + Curve -->
      <div 
        class="absolute -top-3 -left-2 w-4 h-[40px] border-l-2 border-b-2 border-gray-200 rounded-bl-xl pointer-events-none"
      ></div>
      
      <!-- 自分が最後でない場合、下に続く縦線 -->
      <div 
        v-if="!isLast"
        class="absolute top-0 bottom-0 -left-2 w-0 border-l-2 border-gray-200 pointer-events-none"
      ></div>
    </template>

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
        <template v-for="(segment, i) in parsedComment" :key="i">
          <span 
            v-if="segment.isMention" 
            class="text-primary font-bold"
          >{{ segment.text }}</span>
          <span v-else>{{ segment.text }}</span>
        </template>
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
          :initial-comment="`@${comment.name} `"
          @submit="(payload) => emit('submit', payload)"
          @cancel="emit('cancel')"
        />
      </div>
    </div>

    <!-- 子コメントコンテナ（再帰表示） -->
    <!-- 親アバター中心(32px)から -left-2 (-8px) の位置に線を引くため、
         子コンテナは padding box 左端から 40px 位置に線を引く -->
    <div v-if="comment.replies && comment.replies.length > 0 && (!depth || depth < 1)" class="pl-12 relative">
      <!-- ルート直下の場合、親アバター下からの接続線を補完 -->
      <!-- 親アバター中心は(ml-2 + px-4 + 16) = 40px -->
      <!-- pl-12コンテナの左端(0)から 40px の位置に線を引く -> left-10 -->
      <div v-if="depth === 0" class="absolute left-10 -top-3 h-4 w-0 border-l-2 border-gray-200 pointer-events-none"></div>

      <!-- ルート直下の場合、親からの接続線を補完 -->
      <!-- 親アバター中心は32px。子コンテナ開始は48px。差は-16px (-left-4)。 -->
      <!-- 上記の `border-l-2` のロジックで合っているはず。
           各子は `-left-6` に縦線を持つ（!isLastの場合）。
           
           問題は「最初の子」の上の線。
           `div class="absolute ... -top-3"` でカバーしている。
           
           これで理論上はつながるはず。
      -->
      
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
