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
    default: 'default',
    validator: (value: string) =>
      ['default', 'compact', 'pinned'].includes(value),
  },
});

const formattedDate = computed(() => {
  const dateStr = props.article.publishedAt ?? props.article.createdAt;
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
});

// カード用にサマリーを50文字へ制限
const summary = computed(() => {
  const fullSummary = props.article.summary ?? '';
  return fullSummary.length > 50
    ? fullSummary.slice(0, 50) + '...'
    : fullSummary;
});

// タグをクリックした時の処理
const router = useRouter();
function navigateToTag(tag: Tag) {
  router.push(`/tag/${tag.slug}`);
}
</script>

<template>
  <!-- Default Layout -->
  <NuxtLink v-if="variant === 'default'" :to="`/entry/${article.id}`"
    class="group flex h-full flex-col pl-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
    <!-- 画像エリア 多層オフセット枠 -->
    <div class="relative">
      <!-- 縦書きラベル -->
      <span
        class="font-futura absolute -left-4 top-0 text-[8px] tracking-[0.25em] text-fg-muted/70 [writing-mode:vertical-rl]"
        aria-hidden="true">
        {{ formattedDate }} / ENTRY
      </span>
      <div
        class="ac-clip absolute inset-0 -translate-y-1.5 translate-x-1.5 border border-accent/30 bg-accent/10 transition-transform duration-300 group-hover:-translate-y-2.5 group-hover:translate-x-2.5"
        aria-hidden="true"></div>
      <div
        class="ac-clip absolute inset-0 -translate-y-[3px] translate-x-[3px] border border-accent/40 bg-accent/20 transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:translate-x-1.5"
        aria-hidden="true"></div>
      <!-- 本体 -->
      <div class="ac-clip relative aspect-video overflow-hidden border border-border-subtle bg-surface-muted">
        <MqOgImage :content-id="article.id" :url="article.eyecatch?.url" :title="article.title" fill
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          :style="transition ? `view-transition-name: article-${article.id};` : ''
            " />
      </div>
      <!-- トンボ+コーナードット -->
      <span class="ac-frame" aria-hidden="true"></span>
      <span class="absolute -right-1.5 -top-1.5 size-1 rounded-full bg-accent/70" aria-hidden="true"></span>
      <span class="absolute -bottom-1.5 -left-1.5 size-1 rounded-full bg-accent/70" aria-hidden="true"></span>
    </div>

    <!-- 日付+結び罫 -->
    <div class="mt-3 flex items-center gap-1.5">
      <time :datetime="article.publishedAt ?? article.createdAt"
        class="font-futura text-[10px] tracking-[0.2em] text-fg-muted">
        {{ formattedDate }}
      </time>
      <span class="h-px flex-1 bg-border-subtle" aria-hidden="true"></span>
      <svg class="size-1.5 text-accent/60 transition-colors group-hover:text-accent" viewBox="0 0 12 12" fill="none"
        stroke="currentColor" stroke-width="1.4" aria-hidden="true">
        <rect x="0.5" y="0.5" width="11" height="11" />
        <line x1="0.5" y1="11.5" x2="11.5" y2="0.5" />
      </svg>
    </div>

    <h3
      class="mt-1.5 text-sm font-semibold text-fg leading-snug line-clamp-2 group-hover:text-primary transition-colors"
      :style="transition ? `view-transition-name: article-title-${article.id};` : ''
        ">
      {{ article.title }}
    </h3>

    <p class="mt-1 flex-1 text-xs leading-relaxed text-fg-muted line-clamp-2">
      {{ summary }}
    </p>

    <!-- タグ + 矢印 -->
    <div class="mt-2 flex items-center justify-between">
      <div v-if="article.tags?.length" class="flex flex-wrap gap-1.5 min-w-0 overflow-hidden">
        <MqTag v-for="tag in article.tags.slice(0, 2)" :key="tag.id" :tag="tag" @click.stop.prevent="navigateToTag(tag)"
          :transition="tagTransition" class="text-[10px]" />
      </div>
      <Icon name="lucide:arrow-right"
        class="ml-auto size-3.5 shrink-0 text-fg-muted/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </div>
  </NuxtLink>

  <!-- Pinned Layout -->
  <NuxtLink v-else-if="variant === 'pinned'" :to="`/entry/${article.id}`"
    class="group flex items-center gap-4 rounded-xl border-none bg-surface-elevated hover:bg-surface-elevated/80 px-4 py-3.5 transition-all duration-200">
    <!-- サムネイル -->
    <div class="relative size-14 shrink-0 rounded-lg overflow-hidden bg-surface-muted">
      <MqOgImage :content-id="article.id" :url="article.eyecatch?.url" :title="article.title" fill
        class="absolute inset-0 size-full object-cover" :style="transition ? `view-transition-name: article-${article.id};` : ''
          " />
    </div>

    <!-- テキスト -->
    <div class="flex-1 min-w-0 space-y-1">
      <h3 class="text-sm font-semibold text-fg line-clamp-2 leading-snug group-hover:text-primary transition-colors"
        :style="transition ? `view-transition-name: article-title-${article.id};` : ''
          ">
        {{ article.title }}
      </h3>
      <time class="font-futura block text-[11px] tracking-wide text-fg-muted tabular-nums">
        {{ formattedDate }}
      </time>
    </div>

    <!-- 矢印 -->
    <Icon name="lucide:arrow-right"
      class="size-4 shrink-0 text-fg-muted/60 group-hover:text-primary transition-colors" />
  </NuxtLink>

  <!-- Compact Layout -->
  <NuxtLink v-else-if="variant === 'compact'" :to="`/entry/${article.id}`"
    class="group flex items-start gap-3 rounded-lg border border-border-subtle/60 bg-surface-elevated/80 p-3 transition-all duration-300 hover:bg-surface-elevated hover:border-primary/30">
    <!-- Thumbnail -->
    <div class="relative w-28 aspect-video shrink-0 overflow-hidden rounded-md bg-surface-muted">
      <MqOgImage :content-id="article.id" :url="article.eyecatch?.url" :title="article.title" fill
        class="absolute inset-0 h-full w-full object-fit transition-transform duration-500 group-hover:scale-105"
        :style="transition ? `view-transition-name: article-${article.id};` : ''
          " />
    </div>

    <!-- Content -->
    <div class="flex min-w-0 flex-1 flex-col justify-between self-stretch py-0.5">
      <h3 class="line-clamp-1 text-sm leading-snug transition-colors group-hover:text-primary" :style="transition ? `view-transition-name: article-title-${article.id};` : ''
        ">
        {{ article.title }}
      </h3>
      <p class="line-clamp-2 text-xs leading-snug text-fg-muted transition-colors group-hover:text-primary">
        {{ summary }}
      </p>
      <div class="mt-auto pt-1 flex items-center gap-2">
        <div v-if="article.tags && article.tags.length > 0" class="flex flex-nowrap overflow-hidden min-w-0">
          <MqTag v-for="tag in article.tags" :key="tag.id" :tag="tag" @click.stop.prevent="navigateToTag(tag)"
            variant="compact" :transition="tagTransition" class="shrink-0" />
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
/* 切り欠きクリップ 右上/左下 */
.ac-clip {
  clip-path: polygon(0 0,
      calc(100% - 12px) 0,
      100% 12px,
      100% 100%,
      12px 100%,
      0 calc(100% - 12px));
}

/* トンボ 左上/右下 */
.ac-frame {
  position: absolute;
  inset: -7px;
  pointer-events: none;
}

.ac-frame::before,
.ac-frame::after {
  content: '';
  position: absolute;
  width: 13px;
  height: 13px;
}

.ac-frame::before {
  left: 0;
  top: 0;
  border-left: 1px solid rgba(224, 86, 127, 0.4);
  border-top: 1px solid rgba(224, 86, 127, 0.4);
}

.ac-frame::after {
  right: 0;
  bottom: 0;
  border-right: 1px solid rgba(224, 86, 127, 0.4);
  border-bottom: 1px solid rgba(224, 86, 127, 0.4);
}
</style>
