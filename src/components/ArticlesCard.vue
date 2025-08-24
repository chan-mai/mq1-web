<script setup lang="ts">

const props = defineProps({
    article: {
        type: Object as () => Article,
        required: true,
    },
    transition: {
        type: Boolean,
        default: false
    }
});

// サマリーを生成
const summary = computed(async () => {
    const fullSummary = await useSummaryTextGenerator(props.article.id);
    // カード用に80文字に制限
    return fullSummary.length > 50  
        ? fullSummary.slice(0, 50) + '...' 
        : fullSummary;
});

// タグをクリックした時の処理
const router = useRouter();
function navigateToTag(tag: any) {
    router.push(`/tag/${tag.id}`);
}
</script>

<template>
    <div class="group relative rounded-lg transition-all duration-300 overflow-hidden card-border h-full">
        <NuxtLink :to="`/entry/${article.id}`" class="block h-full flex flex-col">
            <!-- 画像エリア -->
            <div class="relative w-full aspect-[2/1] overflow-hidden">
                <MqOgImage 
                    :url="article.eyecatch?.url" 
                    :title="article.title" 
                    fill
                    class="object-cover transition-transform duration-300 group-hover:scale-105"
                    :style="`view-transition-name: article-${article.id};`" 
                />
                <!-- オーバーレイ -->
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
            </div>

            <!-- コンテンツエリア -->
            <div class="p-4 flex flex-col flex-1">
                <!-- 日付 -->
                <div class="text-xs text-gray-500 mb-2">
                    {{ new Date(article.publishedAt! ?? article.createdAt!).toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        timeZone: 'Asia/Tokyo',
                    }) }}
                </div>

                <!-- タイトル -->
                <h3 
                    class="text-base font-semibold text-gray-800 mb-2 line-clamp-1 group-hover:text-accent transition-colors duration-200"
                    :style="`view-transition-name: article-title-${article.id};`"
                >
                    {{ article.title }}
                </h3>

                <!-- サマリー -->
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                    {{ summary }}
                </p>

                <!-- タグ -->
                <div v-if="article.tags && article.tags.length > 0" class="flex gap-1 mb-3 overflow-hidden">
                    <MqTag 
                        v-for="tag in article.tags.slice(0, 3)" 
                        :key="tag.id"
                        :tag="tag" 
                        @click.stop.prevent="navigateToTag(tag)"
                        :transition 
                        class="text-xs px-2 py-1 flex-shrink-0 tag-fixed card-tag"
                    />
                </div>

                <!-- 続きを読むリンク -->
                <div class="mt-auto pt-2">
                    <div class="text-accent text-sm inline-flex items-center group-hover:translate-x-1 transition-transform duration-200">
                        続きを読む
                        <Icon 
                            name="material-symbols:arrow-circle-right-outline"
                            class="w-4 h-4 ml-1" 
                        />
                    </div>
                </div>
            </div>
        </NuxtLink>
    </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-border {
    position: relative;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid transparent;
    border-radius: 0.5rem;
    backdrop-filter: blur(8px);
}

.card-border::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 1px;
    background: linear-gradient(135deg, #fc9fa8, #f57aa5, #f57aa5, #fc9fa8);
    border-radius: 0.5rem;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
}

.card-border:hover {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
}

.card-border:hover::before {
    background: linear-gradient(135deg, #e91e63, #f57aa5, #fc9fa8, #f57aa5, #e91e63);
}

.card-tag :deep(.tag-icon) {
    color: theme('colors.primary') !important;
}

.card-tag:hover :deep(.tag-icon) {
    color: white !important;
}

</style>
