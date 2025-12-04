<script setup lang="ts">
import type { MicroCMSObject } from '#shared/types/microccms';

const props = defineProps({
    article: {
        type: Object as () => MicroCMSObject<Article>,
        required: true,
    },
    transition: {
        type: Boolean,
        default: false
    },
    variant: {
        type: String,
        default: 'default',
        validator: (value: string) => ['default', 'compact'].includes(value)
    }
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

// サマリーを生成
const summary = computed(() => {
    const fullSummary = useSummaryTextGenerator(props.article.content!);
    // カード用に80文字に制限
    return fullSummary.length > 50  
        ? fullSummary.slice(0, 50) + '...' 
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
        class="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
        <!-- 画像エリア -->
        <div class="relative aspect-video w-full bg-gray-100 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-gray-100 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
            
            <MqOgImage 
                :content-id="article.id"
                :url="article.eyecatch?.url"
                :title="article.title" 
                fill
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                :style="`view-transition-name: article-${article.id};`" 
            />

            <!-- 日付バッジ -->
            <div class="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-0.5 font-mono text-xs text-gray-500 backdrop-blur border border-primary/50">
                <time :datetime="article.publishedAt ?? article.createdAt">
                    {{ formattedDate }}
                </time>
            </div>
        </div>

        <!-- コンテンツエリア -->
        <div class="flex flex-1 flex-col p-4 md:p-5">
            <!-- タイトル -->
            <h3 
                class="mb-3 text-lg transition-colors group-hover:text-primary leading-[1.5] line-clamp-1"
                :style="`view-transition-name: article-title-${article.id};`"
            >
                {{ article.title }}
            </h3>

            <!-- サマリー -->
            <p class="mb-4 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-3">
                {{ summary }}
            </p>

            <!-- タグ -->
            <div v-if="article.tags && article.tags.length > 0" class="mb-3 flex flex-wrap gap-2">
                <MqTag 
                    v-for="tag in article.tags.slice(0, 3)" 
                    :key="tag.id"
                    :tag="tag" 
                    @click.stop.prevent="navigateToTag(tag)"
                    :transition
                    class="text-[10px] px-2 py-0.5"
                />
            </div>

            <!-- 続きを読む -->
            <div class="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                <span class="text-xs text-gray-400 transition-colors group-hover:text-primary">記事を読む</span>
                <div class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-600 transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon name="lucide:chevron-right" class="h-3.5 w-3.5" />
                </div>
            </div>
        </div>
    </NuxtLink>

    <!-- Compact Layout -->
    <NuxtLink 
        v-else-if="variant === 'compact'"
        :to="`/entry/${article.id}`" 
        class="group flex items-start gap-3 rounded-lg border border-gray-100 bg-white/80 p-3 transition-all duration-300 hover:bg-white hover:border-primary/30 hover:shadow-sm"
    >
        <!-- Thumbnail -->
        <div class="relative w-28 aspect-video shrink-0 overflow-hidden rounded-md bg-gray-100">
            <MqOgImage 
                :content-id="article.id"
                :url="article.eyecatch?.url"
                :title="article.title" 
                fill
                class="absolute inset-0 h-full w-full object-fit transition-transform duration-500 group-hover:scale-105"
            />
        </div>

        <!-- Content -->
        <div class="flex min-w-0 flex-1 flex-col justify-between self-stretch py-0.5">
            <h3 class="line-clamp-1 text-sm leading-snug transition-colors group-hover:text-primary">
                {{ article.title }}
            </h3>
            <p class="line-clamp-2 text-xs leading-snug text-gray-500 transition-colors group-hover:text-primary">
                {{ summary }}
            </p>
            <div class="mt-auto pt-1 flex items-center gap-2">
                <div v-if="article.tags && article.tags.length > 0" class="flex flex-nowrap overflow-hidden min-w-0">
                    <MqTag 
                        v-for="tag in article.tags" 
                        :key="tag.id"
                        :tag="tag" 
                        @click.stop.prevent="navigateToTag(tag)"
                        variant="compact"
                        :transition
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
