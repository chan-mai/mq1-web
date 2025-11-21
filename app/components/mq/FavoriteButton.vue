<script setup lang="ts">
const props = defineProps<{
  contentId: string;
}>();

const toast = useToast();

// いいね数
const likeCount = useState<number>(`favorite:${props.contentId}:count`, () => 0);
// いいね済みかどうか
const isLiked = useState<boolean>(`favorite:${props.contentId}:liked`, () => false);
// いいねID
const likeId = useState<string | null>(`favorite:${props.contentId}:id`, () => null);
// ローディング状態
const isLoading = useState<boolean>(`favorite:${props.contentId}:loading`, () => false);

// 猫preload関連
const catApiUrl = 'https://cataas.com/cat/says/Thnak%20You?fontSize=100&fontColor=white';
// 事前取得URL
const preloadedCatUrl = useState<string | null>(`favorite:${props.contentId}:preloadedCat`, () => null);
const currentCatImageUrl = ref<string | null>(null);
const isPreloadingCat = useState<boolean>(`favorite:${props.contentId}:preloadingCat`, () => false);

const preloadCatImage = async () => {
  if (isPreloadingCat.value) return;
  isPreloadingCat.value = true;
  try {
    const res = await fetch(catApiUrl, { cache: 'no-store' });
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    preloadedCatUrl.value = objUrl;
  } catch (e) {
    console.error('Failed to preload cat image:', e);
  } finally {
    isPreloadingCat.value = false;
  }
};

const ensureCatPreloaded = () => {
  if (!preloadedCatUrl.value && !isPreloadingCat.value) preloadCatImage();
};

// 初回の件数取得中か
const isInitialLoading = useState<boolean>(`favorite:${props.contentId}:initLoading`, () => true);

// いいね数を取得
const fetchLikeCount = async () => {
  isInitialLoading.value = true;
  try {
    const response = await $fetch(`/api/favorite/${props.contentId}`);
    if (response.status === 'success') {
      likeCount.value = response.count;
    }
  } catch (err) {
    console.error('Failed to fetch like count:', err);
  } finally {
    isInitialLoading.value = false;
  }
};

// いいねを追加
const addLike = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  
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
      // ありがとう表示
      currentCatImageUrl.value = preloadedCatUrl.value || catApiUrl;
      preloadedCatUrl.value = null; // 使い切り
      showLikeCard.value = true;
      toast.success({
        title: 'いいね！しました',
      });
      setTimeout(() => {
        showLikeCard.value = false;
        // 表示に使った blob URL をクリーンアップ
        if (currentCatImageUrl.value && currentCatImageUrl.value.startsWith('blob:')) {
          URL.revokeObjectURL(currentCatImageUrl.value);
        }
        currentCatImageUrl.value = null;
      }, 5000);
      // 次回用に再プリロード
      preloadCatImage();
      
    } else if (response.status === 'error') {
      // エラー
      toast.error({
        title: 'いいねの追加に失敗しました',
        description: response.message,
      });
    }
  } catch (err: any) {
    console.error('Failed to add like:', err);
    toast.error({
      title: 'いいねの追加に失敗しました。もう一度お試しください。',
    });
  } finally {
    isLoading.value = false;
  }
};

// いいねを解除
const removeLike = async () => {
  if (isLoading.value || !likeId.value) return;
  
  isLoading.value = true;
  
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
      toast.success({
        title: 'いいね！を解除しました',
      });
    } else if (response.status === 'error') {
      // エラー
      toast.error({
        title: 'いいねの解除に失敗しました',
      });
    }
  } catch (err: any) {
    console.error('Failed to remove like:', err);
    toast.error({
      title: 'いいねの解除に失敗しました。もう一度お試しください。',
    });
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

// いいね時のワンショット演出用フラグ
const justLiked = ref(false);
watch(isLiked, (val, oldVal) => {
  if (val && !oldVal) {
    justLiked.value = true;
    setTimeout(() => {
      justLiked.value = false;
    }, 500);
  }
});

// 成功カード表示
const showLikeCard = ref(false);

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
  // backgroundで猫をロード
  preloadCatImage();
});
</script>

<template>
  <div class="relative flex flex-col gap-3 rounded-xl">
    <div class="flex flex-wrap gap-2">
      <button
        @mouseenter="ensureCatPreloaded"
        @focus="ensureCatPreloaded"
        @click="toggleLike"
        :disabled="isLoading || isInitialLoading"
        :class="[
          'group relative flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-2xl min-w-[132px] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
          isLiked
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-300/40 hover:shadow-pink-400/50 hover:-translate-y-[1px]'
            : 'text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-white/10 border border-gray-200/60 dark:border-white/10 backdrop-blur-md hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 dark:hover:from-pink-950/30 dark:hover:to-rose-950/30 hover:border-pink-200/60 hover:shadow-lg hover:shadow-pink-200/40 hover:-translate-y-[1px]',
          (isLoading || isInitialLoading) && 'opacity-75 cursor-wait hover:translate-y-0'
        ]"
        :aria-label="isLiked ? 'いいね！を解除' : 'いいね！する'"
        :title="isLiked ? 'クリックでいいね！を解除' : 'この記事にいいね！'"
      >
        <!-- ローディング中はスピナーを表示 -->
        <Icon 
          v-if="isLoading || isInitialLoading"
          name="mdi:loading"
          class="w-5 h-5 flex-shrink-0 animate-spin"
        />
        <!-- 通常時はハートアイコン -->
        <span v-else class="relative inline-flex items-center justify-center">
          <span v-if="justLiked" class="absolute inline-flex w-6 h-6 rounded-full bg-pink-400/40 opacity-60 animate-ping"></span>
          <Icon 
            :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" 
            :class="[
              'w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110',
              isLiked ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]' : 'text-pink-500',
              justLiked && 'animate-like-pop'
            ]"
          />
        </span>
        <span class="whitespace-nowrap font-medium">
          {{ isInitialLoading ? '取得中' :  isLoading ? '処理中...' : isLiked ? 'いいね！済み' : 'いいね！する' }}
        </span>
        <span 
          v-if="!isInitialLoading"
          :class="[
            'ml-1 px-2 py-0.5 rounded-full text-xs font-bold',
            isLiked 
              ? 'bg-white/25 text-white' 
              : 'bg-gray-100 text-gray-700 group-hover:bg-pink-100 group-hover:text-pink-700'
          ]"
        >
          {{ likeCount }}
        </span>
      </button>
    </div>
    
    <!-- いいねありがとう -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="showLikeCard"
        class="z-50 absolute top-14 left-0 mt-2 w-full max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-2xl p-4 border border-gray-200/70 dark:border-white/10"
        role="status" aria-live="polite"
      >
        <!-- 吹き出しの矢印 -->
        <div class="pointer-events-none absolute -top-2 left-6 h-4 w-4 rotate-45 bg-white/95 dark:bg-gray-900/95 border-l border-t border-gray-200/70 dark:border-white/10"></div>
        <div class="overflow-hidden rounded-xl border border-gray-200/70 dark:border-white/10">
          <img :src="currentCatImageUrl || catApiUrl" alt="Thank you cat" class="w-full object-cover" />
        </div>
        <div class="mt-3 flex items-center gap-3">
          <p class="text-base font-normal text-gray-700">
            ありがとう‼️
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@keyframes like-pop {
  0% { transform: scale(0.85); }
  60% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
.animate-like-pop {
  animation: like-pop 300ms ease-out;
}
</style>

