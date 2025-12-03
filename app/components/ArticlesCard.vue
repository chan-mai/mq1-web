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
    }
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
    <NuxtLink 
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
                    {{ new Date(article.publishedAt! ?? article.createdAt!).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        timeZone: 'Asia/Tokyo',
                    }).replace(/\//g, '.') }}
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
</template>

<style scoped>
/* Tailwind Utility Classes are used instead of Scoped CSS */
</style>
