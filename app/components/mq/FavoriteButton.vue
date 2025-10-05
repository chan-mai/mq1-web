<script setup lang="ts">
const props = defineProps<{
  contentId: string;
}>();

// いいね数
const likeCount = ref<number>(0);
// いいね済みかどうか
const isLiked = ref<boolean>(false);
// いいねID
const likeId = ref<string | null>(null);
// ローディング状態
const isLoading = ref<boolean>(false);
// エラー状態
const error = ref<string | null>(null);
// 成功メッセージ
const successMessage = ref<string | null>(null);

// いいね数を取得
const fetchLikeCount = async () => {
  try {
    const response = await $fetch(`/api/favorite/${props.contentId}`);
    if (response.status === 'success') {
      likeCount.value = response.count;
    }
  } catch (err) {
    console.error('Failed to fetch like count:', err);
  }
};

// いいねを追加
const addLike = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  error.value = null;
  successMessage.value = null;
  
  try {
    const response = await $fetch(`/api/favorite/${props.contentId}`, {
      method: 'PUT',
    });
    
    if (response.status === 'success' && response.favorite) {
      // 成功
      isLiked.value = true;
      likeId.value = response.favorite.id;
      likeCount.value += 1;
      // ローカルストレージにIDを保存
      localStorage.setItem(`liked-${props.contentId}`, response.favorite.id);
      successMessage.value = 'いいね！しました';
      
      // 成功メッセージを3秒後に消す
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    } else if (response.status === 'error') {
      // エラー
      if (response.message === 'Favorite already exists') {
        isLiked.value = true;
        error.value = 'すでにいいね済みです';
      } else {
        error.value = response.message || 'いいねの追加に失敗しました';
      }
      
      // エラーメッセージを5秒後に消す
      setTimeout(() => {
        error.value = null;
      }, 5000);
    }
  } catch (err: any) {
    console.error('Failed to add like:', err);
    error.value = err?.data?.message || 'いいねの追加に失敗しました。もう一度お試しください。';
    
    // エラーメッセージを5秒後に消す
    setTimeout(() => {
      error.value = null;
    }, 5000);
  } finally {
    isLoading.value = false;
  }
};

// いいねを解除
const removeLike = async () => {
  if (isLoading.value || !likeId.value) return;
  
  isLoading.value = true;
  error.value = null;
  successMessage.value = null;
  
  try {
    const response = await $fetch(`/api/favorite/${props.contentId}?id=${likeId.value}`, {
      method: 'DELETE',
    });
    
    if (response.status === 'success') {
      // 成功
      isLiked.value = false;
      likeId.value = null;
      likeCount.value = Math.max(0, likeCount.value - 1);
      // ローカルストレージから削除
      localStorage.removeItem(`liked-${props.contentId}`);
      successMessage.value = 'いいねを解除しました';
      
      // 成功メッセージを3秒後に消す
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    } else if (response.status === 'error') {
      // エラー
      error.value = response.message || 'いいねの解除に失敗しました';
      
      // エラーメッセージを5秒後に消す
      setTimeout(() => {
        error.value = null;
      }, 5000);
    }
  } catch (err: any) {
    console.error('Failed to remove like:', err);
    error.value = err?.data?.message || 'いいねの解除に失敗しました。もう一度お試しください。';
    
    // エラーメッセージを5秒後に消す
    setTimeout(() => {
      error.value = null;
    }, 5000);
  } finally {
    isLoading.value = false;
  }
};

// いいねのトグル（追加または解除）
const toggleLike = () => {
  if (isLiked.value) {
    removeLike();
  } else {
    addLike();
  }
};

// 初期化
onMounted(() => {
  // ローカルストレージからいいね状態を復元
  const storedLikeId = localStorage.getItem(`liked-${props.contentId}`);
  if (storedLikeId) {
    isLiked.value = true;
    likeId.value = storedLikeId;
  }
  
  // いいね数を取得
  fetchLikeCount();
});
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl px-5 py-4">
    <div class="flex flex-wrap gap-2">
      <button
        @click="toggleLike"
        :disabled="isLoading"
        :class="[
          'group relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl min-w-[120px]',
          isLiked 
            ? 'bg-primary text-white hover:opacity-80 hover:scale-105' 
            : 'text-gray-600 bg-white/70 backdrop-blur-sm border border-gray-200/60 hover:bg-primary hover:text-white hover:shadow-lg hover:scale-105 hover:shadow-pink-200/50 focus:ring-pink-500/20',
          isLoading && 'opacity-75 cursor-wait hover:scale-100'
        ]"
        :aria-label="isLiked ? 'いいね！を解除' : 'いいね！する'"
        :title="isLiked ? 'クリックでいいね！を解除' : 'この記事にいいね！'"
      >
        <!-- ローディング中はスピナーを表示 -->
        <Icon 
          v-if="isLoading"
          name="mdi:loading"
          class="w-5 h-5 flex-shrink-0 animate-spin"
        />
        <!-- 通常時はハートアイコン -->
        <Icon 
          v-else
          :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" 
          :class="[
            'w-5 h-5 flex-shrink-0 transition-transform',
            'group-hover:scale-110'
          ]"
        />
        <span class="whitespace-nowrap font-medium">
          {{ isLoading ? '処理中...' : isLiked ? 'いいね！済み' : 'いいね！する' }}
        </span>
        <span 
          :class="[
            'ml-1 px-2 py-0.5 rounded-full text-xs font-bold',
            isLiked 
              ? 'bg-white/30 text-white' 
              : 'bg-gray-100 text-gray-700 group-hover:bg-white/30 group-hover:text-white'
          ]"
        >
          {{ likeCount }}
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
  </div>
</template>

