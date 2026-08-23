<script setup lang="ts">
const props = defineProps({
  currentArticle: {
    type: Object as () => Article,
    required: true,
  },
});

// 前後記事を取得
const { data: adjacentResponse } = await useFetch(
  `/api/articles/${props.currentArticle.id}/adjacent`,
  { key: `adjacent-${props.currentArticle.id}` },
);

const prevArticle = computed(() => adjacentResponse.value?.older ?? null);
const nextArticle = computed(() => adjacentResponse.value?.newer ?? null);
</script>
<template>
  <div class="max-w-6xl mx-auto px-4 mb-12 sm:mb-20 pt-8 border-t border-border-subtle">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 前の記事 -->
      <div class="flex flex-col h-full">
        <NuxtLink v-if="prevArticle" :to="`/entry/${prevArticle.id}`" class="group h-full block">
          <div
            class="h-full bg-surface-elevated border border-border-subtle rounded-xl p-5 hover:border-primary hover:bg-primary/10 transition-colors duration-300 relative overflow-hidden">
            <!-- Label & Icon -->
            <div class="flex items-center text-fg-muted group-hover:text-primary transition-colors duration-300 mb-3">
              <Icon name="lucide:chevron-left" class="w-4 h-4 mr-1.5" />
              <span class="text-xs font-bold tracking-wider uppercase">Previous Article</span>
            </div>

            <div class="flex gap-4 items-start">
              <!-- Thumbnail (Desktop: Left, Mobile: Hidden or Small) -->
              <div class="hidden sm:block shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-surface-muted">
                <MqOgImage :url="prevArticle.eyecatch?.url" :content-id="prevArticle.id" :title="prevArticle.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  :style="`view-transition-name: article-${prevArticle.id};`" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h4
                  class="text-fg group-hover:text-primary font-bold text-base leading-snug line-clamp-2 mb-2 transition-colors duration-300"
                  :style="`view-transition-name: article-title-${prevArticle.id};`">
                  {{ prevArticle.title }}
                </h4>
                <p class="text-sm text-fg-muted line-clamp-2 leading-relaxed">
                  {{ prevArticle.summary || "No summary available." }}
                </p>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Empty State for Prev -->
        <div v-else
          class="h-full bg-surface-muted border border-border-subtle rounded-xl p-5 flex flex-col justify-center items-center text-center opacity-75">
          <div
            class="w-10 h-10 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center mb-3 text-fg-muted">
            <Icon name="lucide:chevron-first" class="w-5 h-5" />
          </div>
          <p class="text-sm font-medium text-fg-muted">最古の記事です</p>
        </div>
      </div>

      <!-- 次の記事 -->
      <div class="flex flex-col h-full">
        <NuxtLink v-if="nextArticle" :to="`/entry/${nextArticle.id}`" class="group h-full block">
          <div
            class="h-full bg-surface-elevated border border-border-subtle rounded-xl p-5 hover:border-primary hover:bg-primary/10 transition-colors duration-300 relative overflow-hidden">
            <!-- Label & Icon -->
            <div
              class="flex items-center justify-end text-fg-muted group-hover:text-primary transition-colors duration-300 mb-3">
              <span class="text-xs font-bold tracking-wider uppercase">Next Article</span>
              <Icon name="lucide:chevron-right" class="w-4 h-4 ml-1.5" />
            </div>

            <div class="flex flex-row-reverse gap-4 items-start">
              <!-- Thumbnail -->
              <div class="hidden sm:block shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-surface-muted">
                <MqOgImage :url="nextArticle.eyecatch?.url" :content-id="nextArticle.id" :title="nextArticle.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  :style="`view-transition-name: article-${nextArticle.id};`" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0 text-right">
                <h4
                  class="text-fg group-hover:text-primary font-bold text-base leading-snug line-clamp-2 mb-2 transition-colors duration-300"
                  :style="`view-transition-name: article-title-${nextArticle.id};`">
                  {{ nextArticle.title }}
                </h4>
                <p class="text-sm text-fg-muted line-clamp-2 leading-relaxed">
                  {{ nextArticle.summary || "No summary available." }}
                </p>
              </div>
            </div>
          </div>
        </NuxtLink>

        <!-- Empty State for Next -->
        <div v-else
          class="h-full bg-surface-muted border border-border-subtle rounded-xl p-5 flex flex-col justify-center items-center text-center opacity-75">
          <div
            class="w-10 h-10 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center mb-3 text-fg-muted">
            <Icon name="lucide:chevron-last" class="w-5 h-5" />
          </div>
          <p class="text-sm font-medium text-fg-muted">最新の記事です</p>
        </div>
      </div>
    </div>
    <MqRssCta type="inline" />
  </div>
</template>
<style lang="css" scoped>
/* Scoped styles can be minimal now as we heavily leverage Tailwind */
</style>
