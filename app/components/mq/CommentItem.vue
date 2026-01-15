<script setup lang="ts">
import Avatar from 'vue-boring-avatars';

import { onClickOutside } from '@vueuse/core';

const props = defineProps<{
  comment: CommentWithReplies;
  depth?: number;
  hideChildren?: boolean;
  replyToName?: string;
}>();

  const emit = defineEmits<{
  (e: 'reply', payload: { parentId: string; content: string; name: string; token: string }): void;
  (e: 'updated'): void;
  (e: 'deleted'): void;
}>();

const toast = useToast();
const config = useRuntimeConfig();
const { getCommentSecret, removeCommentSecret } = useCommentStorage();

const isReplying = ref(false);
const isLiked = ref(false); // 初期値false、後でクライアントストレージを確認
const likesCount = ref(props.comment.likes);
const showReplies = ref(true); // デフォルトで開く
const visibleRepliesCount = ref(1); // 初期表示数
const likeId = ref<string | null>(null);
const isLoading = ref(false);

const MAX_NEST_DEPTH = 1; // 0=ルート, 1=子(ネスト). それ以降はフラット化.
const REPLIES_INCREMENT = 5;

const depth = props.depth || 0;
const hasReplies = computed(() => props.comment.replies && props.comment.replies.length > 0);

const storageKey = computed(() => `liked-comments-${props.comment.contentId}`);

// フラット化ロジック
interface FlatComment {
  comment: CommentWithReplies;
  replyTo: string;
}

const flattenReplies = (comments: CommentWithReplies[], parentName: string): FlatComment[] => {
  const result: FlatComment[] = [];
  for (const c of comments) {
    result.push({ comment: c, replyTo: parentName });
    if (c.replies && c.replies.length > 0) {
      result.push(...flattenReplies(c.replies, c.name));
    }
  }
  return result;
};

// このコメントの子要素をフラット化するかどうか判定
// 現在の深度が MAX_NEST_DEPTH 以上ならフラット化
const shouldFlattenChildren = computed(() => depth >= MAX_NEST_DEPTH);

const displayReplies = computed(() => {
  if (!hasReplies.value || props.hideChildren) return [];
  
  if (shouldFlattenChildren.value) {
    return flattenReplies(props.comment.replies!, props.comment.name);
  } else {
    // 通常のネスト: 直接の子要素を統一構造にマップして返す
    return props.comment.replies!.map((c: CommentWithReplies) => ({ comment: c, replyTo: '' }));
  }
});

const totalReplies = computed(() => displayReplies.value.length);
const visibleReplies = computed(() => displayReplies.value.slice(0, visibleRepliesCount.value));
const hasMoreReplies = computed(() => totalReplies.value > visibleRepliesCount.value);
const remainingReplies = computed(() => totalReplies.value - visibleRepliesCount.value);

interface LikedItem {
  commentId: string;
  likeId: string;
}

const getLikedList = (): LikedItem[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey.value) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const saveLikedList = (list: LikedItem[]) => {
  localStorage.setItem(storageKey.value, JSON.stringify(list));
};

const handleLike = async () => {
  if (isLiked.value && !likeId.value) return;
  if (isLoading.value) return;

  isLoading.value = true;
  const originalIsLiked = isLiked.value;
  const originalLikeId = likeId.value;

  try {
    if (originalIsLiked) {
      // 削除
      await $fetch(`/api/comment/like/${props.comment.id}`, {
        method: 'DELETE',
        params: { id: originalLikeId },
      });
      // 成功時のみ更新
      isLiked.value = false;
      likesCount.value = Math.max(0, likesCount.value - 1);
      likeId.value = null;

      const list = getLikedList();
      const newList = list.filter(item => item.commentId !== props.comment.id);
      saveLikedList(newList);
      toast.success({ title: 'いいね！を取り消しました' });
    } else {
      // 作成
      const res = await $fetch<{ status: string; id: string }>(`/api/comment/like/${props.comment.id}`, {
        method: 'PUT',
      });
      if (res.status === 'success') {
         // 成功時のみ更新
         isLiked.value = true;
         likesCount.value = likesCount.value + 1;
         likeId.value = res.id;

         const list = getLikedList();
         const newList = list.filter(item => item.commentId !== props.comment.id);
         newList.push({ commentId: props.comment.id, likeId: res.id });
         saveLikedList(newList);
         toast.success({ title: 'いいね！しました' });
      }
    }
  } catch (error) {
    toast.error({ title: 'いいねの送信に失敗しました' });
  } finally {
    isLoading.value = false;
  }
};

const checkLikeStatus = () => {
  const list = getLikedList();
  const storedItem = list.find(item => item.commentId === props.comment.id);
  const storedId = storedItem?.likeId;
  
  if (storedId) {
    // 安全性確認, 検証前にサーバーデータが利用可能か確認
    if (!Array.isArray(props.comment.likeIds)) {
      console.warn('Comment data missing likeIds', props.comment);
      return; 
    }

    // 整合性確認, いいね数があるのにIDリストが空の場合はデータの不整合を疑い、検証をスキップ
    if (props.comment.likes > 0 && props.comment.likeIds.length === 0) {
       console.warn('Inconsistency: Likes count > 0 but likeIds empty. Skipping validation.', { count: props.comment.likes, ids: props.comment.likeIds });
       return;
    }

    console.log('Validating Like:', { commentId: props.comment.id, storedId, serverIds: props.comment.likeIds });

    // 保存されたいいねIDが実際にサーバー上に存在するか検証
    if (props.comment.likeIds.includes(storedId)) {
      isLiked.value = true;
      likeId.value = storedId;
    } else {
      console.warn('Like ID not found on server, removing local.', { storedId, serverIds: props.comment.likeIds });
      // サーバー上にIDが存在しないため、ローカルの保存済みIDを削除
      const newList = list.filter(item => item.commentId !== props.comment.id);
      saveLikedList(newList);
      isLiked.value = false;
      likeId.value = null;
    }
  } else {
    isLiked.value = false;
    likeId.value = null;
  }
};

const userSecret = ref<string | undefined>(undefined);
const showDeleteModal = ref(false);
const showMenu = ref(false);
const menuRef = ref<HTMLElement | null>(null);

onClickOutside(menuRef, () => {
  showMenu.value = false;
});

const isEditing = ref(false);
const editContent = ref('');
const isSaving = ref(false);

// 編集ボタンクリック時
const handleEdit = () => {
  editContent.value = props.comment.comment;
  isEditing.value = true;
};

// 編集キャンセル
const cancelEdit = () => {
  isEditing.value = false;
  editContent.value = '';
};

// 編集保存
const saveEdit = async () => {
  if (!userSecret.value) return;
  if (!editContent.value.trim()) return;
  if (isSaving.value) return;

  isSaving.value = true;
  try {
    const res = await $fetch<{ status: string; comment: any }>(`/api/comment/${props.comment.id}`, {
      method: 'PATCH',
      body: {
        secret: userSecret.value,
        comment: editContent.value,
      }
    });

    if (res.status === 'success') {
      toast.success({ title: 'コメントを更新しました' });
      isEditing.value = false;
      emit('updated');
    } else {
      throw new Error('Update failed');
    }
  } catch (error) {
    console.error(error);
    toast.error({ title: '更新に失敗しました' });
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = () => {
    if (!userSecret.value) return;
    showDeleteModal.value = true;
};

// モーダルでの確認後実行
const executeDelete = async () => {
    if (!userSecret.value) return;

    try {
        const res = await $fetch<{ status: string }>(`/api/comment/${props.comment.id}`, {
            method: 'DELETE',
            body: { secret: userSecret.value }
        });

        if (res.status === 'success') {
            await removeCommentSecret(props.comment.id);
            toast.success({ title: 'コメントを削除しました' });
            emit('deleted');
        }
    } catch (error) {
        console.error(error);
        toast.error({ title: '削除に失敗しました' });
    }
};

onMounted(async () => {
  checkLikeStatus();
  userSecret.value = await getCommentSecret(props.comment.id);
});

watch(() => props.comment, () => {
  checkLikeStatus();
});

const handleReplySubmit = (payload: { name: string; comment: string; token: string }) => {
  emit('reply', {
    parentId: props.comment.id,
    content: payload.comment,
    name: payload.name,
    token: payload.token
  });
  isReplying.value = false;
  showReplies.value = true;
};

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? "たった今" : `${minutes}分前`;
    }
    return `${hours}時間前`;
  }
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;

  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
</script>

<template>
  <article class="group" :class="{ 'pl-0': depth === 0 }">
    <div class="flex gap-4">
      <div class="shrink-0">
         <div class="h-9 w-9 rounded-full overflow-hidden ring-1 ring-gray-200 bg-white">
            <client-only>
              <Avatar
                :size="36"
                :name="comment.name"
                variant="beam"
                :colors="['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']"
              />
            </client-only>
         </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <span class="font-bold text-sm text-gray-900">{{ comment.name }}</span>
          
          <span v-if="replyToName" class="text-xs text-gray-500 flex items-center justify-center gap-1">
             <Icon name="lucide:reply" class="w-4 h-4" />
             {{ replyToName }}への返信
          </span>

          <span class="text-xs text-gray-400 ml-1">
            {{ formatDate(comment.createdAt) }}
            <span v-if="comment.updatedAt && comment.updatedAt !== comment.createdAt && new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 60000" class="ml-1 text-[10px] text-gray-300">
              (編集済み)
            </span>
          </span>
        </div>

        <div v-if="isEditing" class="mb-3">
          <textarea
            v-model="editContent"
            rows="3"
            class="w-full rounded-lg border-gray-200 bg-gray-50 text-sm focus:border-primary focus:ring-primary p-3"
            :disabled="isSaving"
          ></textarea>
          <div class="flex justify-end gap-2 mt-2">
             <button @click="cancelEdit" class="text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5" :disabled="isSaving">キャンセル</button>
             <button 
               @click="saveEdit" 
               class="text-xs bg-primary text-white rounded-md px-3 py-1.5 hover:bg-primary/90 disabled:opacity-50"
               :disabled="isSaving || !editContent.trim()"
             >
               {{ isSaving ? '保存中...' : '保存する' }}
             </button>
          </div>
        </div>

        <p v-else class="text-sm leading-relaxed text-gray-800 mb-3 whitespace-pre-wrap">{{ comment.comment }}</p>

        <div class="flex items-center gap-4 relative">
          <button
            @click="handleLike"
            :disabled="isLoading"
            class="flex items-center gap-1.5 text-xs border-none transition-colors duration-200 group/like disabled:cursor-not-allowed disabled:opacity-70"
            :class="isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-gray-900'"
          >
            <Icon 
              :name="isLoading ? 'mdi:loading' : 'lucide:heart'" 
              class="w-4 h-4 transition-transform group-active/like:scale-125"
              :class="{ 'animate-spin': isLoading }"
            />
            <span v-if="likesCount > 0" class="font-medium">{{ likesCount }}</span>
          </button>

          <button
            @click="isReplying = !isReplying"
            class="flex items-center gap-1.5 text-xs border-none text-gray-500 hover:text-gray-900 transition-colors duration-200"
          >
            <Icon name="lucide:reply" class="w-4 h-4" />
            <span>返信</span>
          </button>

          <template v-if="userSecret">
             <div ref="menuRef" class="relative">
                <button 
                  @click="showMenu = !showMenu"
                  class="flex items-center justify-center w-6 h-6 border-none rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                   <Icon name="lucide:more-vertical" class="w-4 h-4" />
                </button>

                <div 
                  v-if="showMenu"
                  class="absolute right-0 top-full mt-1 min-w-[120px] bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 overflow-hidden"
                >
                   <button
                     @click="handleEdit(); showMenu = false"
                     class="w-full text-left px-4 py-2 text-xs border-none text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                   >
                      <Icon name="lucide:edit-2" class="w-3 h-3" />
                      編集する
                   </button>
                   <button
                      @click="handleDelete(); showMenu = false"
                      class="w-full text-left px-4 py-2 text-xs border-none text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                   >
                      <Icon name="lucide:trash-2" class="w-3 h-3" />
                      削除する
                   </button>
                </div>
             </div>
          </template>
        </div>

        <div v-if="isReplying" class="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <MqCommentForm
            :is-loading="false"
            :reply-to-name="comment.name"
            @submit="handleReplySubmit"
            @cancel="isReplying = false"
          />
        </div>
      </div>
    </div>

    <div v-if="!hideChildren && totalReplies > 0" class="mt-4 ml-4 md:ml-12 border-l-2 border-gray-100 pl-4">
       <button
         v-if="!showReplies"
         @click="showReplies = true"
         class="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 mb-2 transition-colors"
       >
         <Icon name="lucide:chevron-down" class="w-4 h-4" />
         {{ totalReplies }}件の返信を表示
       </button>

       <div v-else class="flex flex-col gap-6">
         <div v-for="item in visibleReplies" :key="item.comment.id">
            <MqCommentItem
              :comment="item.comment"
              :depth="depth + 1"
              :hide-children="shouldFlattenChildren"
              :reply-to-name="item.replyTo"
              @reply="(p) => $emit('reply', p)"
              @updated="$emit('updated')"
              @deleted="$emit('deleted')"
            />
         </div>

         <button
            v-if="hasMoreReplies"
            @click="visibleRepliesCount += REPLIES_INCREMENT"
            class="flex items-center gap-2 text-xs font-medium text-gray-500 border-none hover:text-gray-900 pt-2 transition-colors"
         >
            <Icon name="lucide:chevron-down" class="w-4 h-4" />
            <span>さらに{{ remainingReplies }}件の返信を表示</span>
         </button>
         
         <button
            v-if="showReplies && totalReplies > 3" 
            @click="showReplies = false"
            class="flex items-center gap-2 text-xs text-gray-400 border-none hover:text-gray-600 pt-2 ml-auto"
         >
            返信を閉じる
         </button>
       </div>
    </div>
  </article>

  <MqConfirmModal
    :is-open="showDeleteModal"
    title="コメントの削除"
    message="このコメントを削除しますか？"
    confirm-text="削除する"
    :is-danger="true"
    @close="showDeleteModal = false"
    @confirm="executeDelete"
  />
</template>
