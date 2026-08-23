<script setup lang="ts">
const props = defineProps({
  article: {
    type: Object as () => Article,
    required: true,
  },
  transition: {
    type: Boolean,
    default: false,
  },
  tagTransition: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value: string) =>
      ["default", "compact", "pinned"].includes(value),
  },
});

const formattedDate = computed(() => {
  const dateStr = props.article.publishedAt ?? props.article.createdAt;
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jstDate.getUTCDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
});

// カード用にサマリーを50文字へ制限
const summary = computed(() => {
  const fullSummary = props.article.summary ?? "";
  return fullSummary.length > 50
    ? fullSummary.slice(0, 50) + "..."
    : fullSummary;
});

// タグをクリックした時の処理
const router = useRouter();
function navigateToTag(tag: any) {
  router.push(`/tag/${tag.slug}`);
}
</script>

<template>
  <!-- Default Layout -->
  <NuxtLink
    v-if="variant === 'default'"
    :to="`/entry/${article.id}`"
    class="group flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle/60 bg-surface-elevated hover:border-primary/40 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  >
    <!-- 画像エリア -->
    <div class="relative aspect-video w-full overflow-hidden bg-surface-muted">
      <MqOgImage
        :content-id="article.id"
        :url="article.eyecatch?.url"
        :title="article.title"
        fill
        class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        :style="
          transition ? `view-transition-name: article-${article.id};` : ''
        "
      />
      <!-- 日付バッジ -->
      <time
        :datetime="article.publishedAt ?? article.createdAt"
        class="absolute bottom-3 left-3 block text-[11px] font-mono text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded"
      >
        {{ formattedDate }}
      </time>
    </div>

    <!-- コンテンツエリア -->
    <div class="flex flex-1 flex-col p-4 gap-2.5">
      <h3
        class="text-sm font-semibold text-fg leading-snug line-clamp-2 group-hover:text-primary transition-colors"
        :style="
          transition ? `view-transition-name: article-title-${article.id};` : ''
        "
      >
        {{ article.title }}
      </h3>

      <p class="text-xs leading-relaxed text-fg-muted line-clamp-2 flex-1">
        {{ summary }}
      </p>

      <!-- タグ + 矢印 -->
      <div
        class="flex items-center justify-between pt-2 border-t border-border-subtle mt-auto"
      >
        <div
          v-if="article.tags?.length"
          class="flex flex-wrap gap-1.5 min-w-0 overflow-hidden"
        >
          <MqTag
            v-for="tag in article.tags.slice(0, 2)"
            :key="tag.id"
            :tag="tag"
            @click.stop.prevent="navigateToTag(tag)"
            :transition="tagTransition"
            class="text-[10px]"
          />
        </div>
        <Icon
          name="lucide:arrow-right"
          class="size-3.5 shrink-0 ml-auto text-fg-muted/60 group-hover:text-primary transition-colors"
        />
      </div>
    </div>
  </NuxtLink>

  <!-- Pinned Layout -->
  <NuxtLink
    v-else-if="variant === 'pinned'"
    :to="`/entry/${article.id}`"
    class="group flex items-center gap-4 rounded-xl ring-1 ring-border-subtle/60 bg-surface-elevated px-4 py-3.5 hover:ring-primary/40 transition-all duration-200"
  >
    <!-- サムネイル -->
    <div
      class="relative size-14 shrink-0 rounded-lg overflow-hidden bg-surface-muted"
    >
      <MqOgImage
        :content-id="article.id"
        :url="article.eyecatch?.url"
        :title="article.title"
        fill
        class="absolute inset-0 size-full object-cover"
        :style="
          transition ? `view-transition-name: article-${article.id};` : ''
        "
      />
    </div>

    <!-- テキスト -->
    <div class="flex-1 min-w-0 space-y-1">
      <h3
        class="text-sm font-semibold text-fg line-clamp-2 leading-snug group-hover:text-primary transition-colors"
        :style="
          transition ? `view-transition-name: article-title-${article.id};` : ''
        "
      >
        {{ article.title }}
      </h3>
      <time class="block text-[11px] text-fg-muted font-mono tabular-nums">
        {{ formattedDate }}
      </time>
    </div>

    <!-- 矢印 -->
    <Icon
      name="lucide:arrow-right"
      class="size-4 shrink-0 text-fg-muted/60 group-hover:text-primary transition-colors"
    />
  </NuxtLink>

  <!-- Compact Layout -->
  <NuxtLink
    v-else-if="variant === 'compact'"
    :to="`/entry/${article.id}`"
    class="group flex items-start gap-3 rounded-lg border border-border-subtle/60 bg-surface-elevated/80 p-3 transition-all duration-300 hover:bg-surface-elevated hover:border-primary/30"
  >
    <!-- Thumbnail -->
    <div
      class="relative w-28 aspect-video shrink-0 overflow-hidden rounded-md bg-surface-muted"
    >
      <MqOgImage
        :content-id="article.id"
        :url="article.eyecatch?.url"
        :title="article.title"
        fill
        class="absolute inset-0 h-full w-full object-fit transition-transform duration-500 group-hover:scale-105"
        :style="
          transition ? `view-transition-name: article-${article.id};` : ''
        "
      />
    </div>

    <!-- Content -->
    <div
      class="flex min-w-0 flex-1 flex-col justify-between self-stretch py-0.5"
    >
      <h3
        class="line-clamp-1 text-sm leading-snug transition-colors group-hover:text-primary"
        :style="
          transition ? `view-transition-name: article-title-${article.id};` : ''
        "
      >
        {{ article.title }}
      </h3>
      <p
        class="line-clamp-2 text-xs leading-snug text-fg-muted transition-colors group-hover:text-primary"
      >
        {{ summary }}
      </p>
      <div class="mt-auto pt-1 flex items-center gap-2">
        <div
          v-if="article.tags && article.tags.length > 0"
          class="flex flex-nowrap overflow-hidden min-w-0"
        >
          <MqTag
            v-for="tag in article.tags"
            :key="tag.id"
            :tag="tag"
            @click.stop.prevent="navigateToTag(tag)"
            variant="compact"
            :transition="tagTransition"
            class="shrink-0"
          />
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
/* Tailwind Utility Classes are used instead of Scoped CSS */
</style>
