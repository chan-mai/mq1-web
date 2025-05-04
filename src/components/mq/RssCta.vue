<script setup lang="ts">
const config = useWebConfig();

const isVisible = ref(false);
const isHovered = ref(false);

type VariantType = 'card' | 'inline' | 'floating';

const props = defineProps({
  type: {
    type: String as PropType<VariantType>,
    default: 'card',
    validator: (value: string) => ['card', 'inline', 'floating'].includes(value)
  },
  storageKey: {
    type: String,
    default: 'rss-cta-dismissed'
  }
});


const containerStyles: Record<VariantType, string> = {
  card: "w-full max-w-xl rounded-xl overflow-hidden",
  inline: "w-full max-w-6xl mx-auto rounded-xl overflow-hidden my-6",
  floating: "fixed bottom-4 right-4 z-50 rounded-xl overflow-hidden w-72 md:w-80"
}

onMounted(() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const isDismissed = localStorage.getItem(props.storageKey) === 'true';
      if (!isDismissed) {
        isVisible.value = true;
      }
    } else {
        isVisible.value = true; // localStorageが使用できない場合は表示
    }
  } catch (error) {
    console.error('localStorage access error:', error);
  }
});

const handleClose = () => {
  isVisible.value = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(props.storageKey, 'true');
    }
  } catch (error) {
    console.error('localStorage write error:', error);
  }
}
</script>
<template>
  <div
    v-if="type !== 'floating' || isVisible"
    :class="containerStyles[type]"
    class="border border-2 border-back"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="relative overflow-hidden">
      <div class="absolute inset-0 bg-white"></div>

      <div class="absolute top-0 left-0 w-24 h-24 rounded-full bg-pink-100 opacity-30 -translate-x-12 -translate-y-12"></div>
      <div class="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-blue-100 opacity-30 translate-x-16 translate-y-16"></div>

      <button
        v-if="type === 'floating'"
        @click="handleClose"
        class="absolute right-2 top-2 z-50 rounded-full bg-white bg-opacity-70 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="閉じる"
      >
        <Icon name="tabler:x" class="h-3.5 w-3.5" />
      </button>

      <div class="relative p-4 md:p-5">
        <div class="flex items-top gap-3">
          <div class="flex h-10 w-full max-h-10 max-w-10 items-center justify-center rounded-full bg-back bg-opacity-70">
            <Icon :name="config.rss.icon" class="h-5 w-5 text-primary" />
          </div>

          <div>
            <h3 class="text-lg text-accent">ブログの更新をお知らせ</h3>
            <p class="text-sm text-gray-500">RSSで購読すると新しい記事の投稿を知ることができます。</p>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <MqPopupRssGuide />
        </div>
      </div>
    </div>
  </div>
</template>

