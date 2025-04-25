<script setup lang="ts">
const props = defineProps({
    currentArticle: {
        type: Object as () => Article,
        required: true,
    },
});

const { data: prevArticleData } = await useAsyncData(`prev-article-${props.currentArticle.id}`, async () => {
    const response = await useMicroCMSGetList<Article>({
        endpoint: 'articles',
        queries: {
            limit: 1,
            orders: '-publishedAt',
            filters: `publishedAt[less_than]${props.currentArticle?.publishedAt}`,
        },
    });
    return response.data.value?.contents[0];
});
const { data: nextArticleData } = await useAsyncData(`next-article-${props.currentArticle.id}`, async () => {
    const response = await useMicroCMSGetList<Article>({
        endpoint: 'articles',
        queries: {
            limit: 1,
            orders: 'publishedAt',
            filters: `publishedAt[greater_than]${props.currentArticle?.publishedAt}`,
        },
    });
    return response.data.value?.contents[0];
});


const prevArticle = computed(() => prevArticleData.value);
const nextArticle = computed(() => nextArticleData.value);
</script>
<template>
    <!-- 前後の記事ナビゲーション -->
    <div class="max-w-6xl mx-auto px-4 mb-16 border-t border-gray-200 pt-8">
        <div class="flex flex-col md:flex-row justify-between gap-6">
            <!-- 前の記事へのリンク -->
            <NuxtLink v-if="prevArticle" :to="`/entry/${prevArticle.id}`" class="slide-hover flex-1">
                <div class="group p-4 border border-gray-200 rounded-lg hover:border-primary transition-all duration-300 h-full">
                    <div class="flex items-center text-gray-500 mb-2">
                        <Icon name="material-symbols:arrow-back" class="mr-1 w-4 h-4 group-hover:text-primary" />
                        <span class="text-sm group-hover:text-primary">前の記事</span>
                    </div>
                    <h4 class="text-gray-800 font-medium line-clamp-">{{ prevArticle.title }}</h4>
                    <div class="mt-2 flex items-center">
                        <div class="w-64 aspect-video max-h-16 mr-3 overflow-hidden rounded">
                            <MqOgImage :url="prevArticle.eyecatch?.url" :title="prevArticle.title" class="w-full h-full object-cover"/>
                        </div>
                        <p class="text-sm text-gray-600 line-clamp-2">{{ prevArticle.summary || '' }}</p>
                    </div>
                </div>
            </NuxtLink>
            <div v-else class="flex-1">
                <div class="p-4 h-full">
                    <div class="flex items-center text-gray-400 mb-2">
                        <Icon name="material-symbols:arrow-back" class="mr-1 w-4 h-4" />
                        <span class="text-sm">前の記事</span>
                    </div>
                    <p class="text-gray-400 font-medium">これが最も古い記事です</p>
                </div>
            </div>

            <!-- 次の記事へのリンク -->
            <NuxtLink v-if="nextArticle" :to="`/entry/${nextArticle.id}`" class="slide-hover flex-1">
                <div class="group p-4 border border-gray-200 rounded-lg hover:border-primary transition-all duration-300 h-full">
                    <div class="flex items-center justify-end text-gray-500 mb-2">
                        <span class="text-sm group-hover:text-primary">次の記事</span>
                        <Icon name="material-symbols:arrow-forward" class="ml-1 w-4 h-4 group-hover:text-primary" />
                    </div>
                    <h4 class="text-gray-800 font-medium line-clamp-2 text-right">{{ nextArticle.title }}</h4>
                    <div class="mt-2 flex items-center">
                        <p class="text-sm text-gray-600 line-clamp-2">{{ nextArticle.summary || '' }}</p>
                        <div class="w-64 aspect-video max-h-16 ml-3 overflow-hidden rounded">
                            <MqOgImage :url="nextArticle.eyecatch?.url" :title="nextArticle.title" class="w-full h-full object-cover"/>
                        </div>
                    </div>
                </div>
            </NuxtLink>
            <div v-else class="flex-1">
                <div class="p-4 h-full">
                    <div class="flex items-center justify-end text-gray-400 mb-2">
                        <span class="text-sm">次の記事</span>
                        <Icon name="material-symbols:arrow-forward" class="ml-1 w-4 h-4" />
                    </div>
                    <p class="text-gray-400 font-medium text-right">これが最新の記事です</p>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="css" scoped>
.slide-hover {
    position: relative;
    overflow: hidden;
}

.slide-hover::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: white;
    transform: translateX(-100%);
    opacity: 0;
    z-index: -1;
    border-radius: 0.5rem;
}

/* ホバー時のアニメーション */
.slide-hover:hover::before {
    animation: slideIn 0.3s forwards;
}

/* ホバーを外した時のアニメーション */
.slide-hover::before {
    animation: fadeOut 0.3s forwards;
}

@keyframes slideIn {
    0% {
        transform: translateX(-100%);
        opacity: 0;
    }

    100% {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes fadeOut {
    0% {
        opacity: 1;
        transform: translateX(0);
    }

    100% {
        opacity: 0;
        transform: translateX(0);
    }
}
</style>
