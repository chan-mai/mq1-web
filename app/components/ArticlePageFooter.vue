<script setup lang="ts">
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '#shared/types/microccms';

const props = defineProps({
    currentArticle: {
        type: Object as () => MicroCMSObject<Article>,
        required: true,
    },
});


const prevArticle: Ref<MicroCMSObject<Article> | null> = ref(null);
const nextArticle: Ref<MicroCMSObject<Article> | null> = ref(null);

// 前と次の記事を並列で取得
const client = useMicroCMSClient();

const { data: prevArticleResponse } = await useAsyncData<MicroCMSObject<Article[]>>(`prev-article-${props.currentArticle.id}`, async () => {
    return await client.getList<MicroCMSObject<Article[]>>({
        endpoint: 'articles',
        queries: {
            limit: 1,
            filters: `publishedAt[less_than]${
                props.currentArticle.publishedAt ?? props.currentArticle.createdAt
            }`,
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});

if (prevArticleResponse.value && prevArticleResponse.value.contents && prevArticleResponse.value.contents.length > 0) {
    prevArticle.value = prevArticleResponse.value.contents[0];
    if (prevArticle.value && prevArticle.value.content) {
        prevArticle.value.summary = useSummaryTextGenerator(prevArticle.value.content);
    }
}

const { data: nextArticleResponse } = await useAsyncData<MicroCMSObject<Article>>(`next-article-${props.currentArticle.id}`, async () => {
    return await client.getList<MicroCMSObject<Article>>({
        endpoint: 'articles',
        queries: {
            limit: 1,
            orders: "publishedAt",
            filters: `publishedAt[greater_than]${
                props.currentArticle.publishedAt ?? props.currentArticle.createdAt
            }`,
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});

if (nextArticleResponse.value && nextArticleResponse.value.contents && nextArticleResponse.value.contents.length > 0) {
    nextArticle.value = nextArticleResponse.value.contents[0];
    if (nextArticle.value && nextArticle.value.content) {
        nextArticle.value.summary = useSummaryTextGenerator(nextArticle.value.content);
    }
}

</script>
<template>
    <div class="max-w-6xl mx-auto px-4 mb-8 sm:mb-16 border-t border-gray-200 pt-4 sm:pt-8">
        <div class="flex flex-col md:flex-row justify-between gap-4 sm:gap-6">
            <!-- 前の記事 -->
            <NuxtLink v-if="prevArticle" :to="`/entry/${prevArticle.id}`" class="slide-hover flex-1">
                <div
                    class="group p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-primary transition-all duration-300 h-full">
                    <div class="flex items-center text-gray-500 mb-2">
                        <Icon name="material-symbols:arrow-back" class="mr-1 w-4 h-4 group-hover:text-primary" />
                        <span class="text-xs sm:text-sm group-hover:text-primary">前の記事</span>
                    </div>
                    <h4
                        class="text-gray-800 text-sm sm:text-base font-medium line-clamp-1 overflow-hidden text-ellipsis">
                        {{ prevArticle.title }}</h4>
                    <div class="mt-2 flex flex-col sm:flex-row items-center">
                        <div
                            class="w-full md:max-w-1/3 md:h-20 sm:max-h-16 mb-2 sm:mb-0 sm:mr-3 overflow-hidden rounded">
                            <MqOgImage :url="prevArticle.eyecatch?.url" :content-id="prevArticle.id" :title="prevArticle.title"
                                class="w-full h-full object-contain" />
                        </div>
                        <p class="text-xs sm:text-sm text-gray-600 overflow-hidden line-clamp-2 sm:line-clamp-3">{{
                            prevArticle.summary || '' }}</p>
                    </div>
                </div>
            </NuxtLink>
            <div v-else class="flex-1">
                <div class="p-3 sm:p-4 h-full">
                    <div class="flex items-center text-gray-400 mb-2">
                        <Icon name="material-symbols:arrow-back" class="mr-1 w-4 h-4" />
                        <span class="text-xs sm:text-sm">前の記事</span>
                    </div>
                    <p class="text-gray-400 font-medium text-sm sm:text-base">これが最も古い記事です</p>
                </div>
            </div>

            <!-- 次の記事 -->
            <NuxtLink v-if="nextArticle" :to="`/entry/${nextArticle.id}`" class="slide-hover flex-1">
                <div
                    class="group p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-primary transition-all duration-300 h-full">
                    <div class="flex items-center justify-end text-gray-500 mb-2">
                        <span class="text-xs sm:text-sm group-hover:text-primary">次の記事</span>
                        <Icon name="material-symbols:arrow-forward" class="ml-1 w-4 h-4 group-hover:text-primary" />
                    </div>
                    <h4
                        class="text-gray-800 text-sm sm:text-base font-medium line-clamp-1 overflow-hidden text-ellipsis text-right">
                        {{ nextArticle.title }}</h4>
                    <div class="mt-2 flex flex-col-reverse sm:flex-row items-center">
                        <p
                            class="text-xs sm:text-sm text-gray-600 overflow-hidden line-clamp-2 sm:line-clamp-3 mt-2 sm:mt-0">
                            {{ nextArticle.summary || '' }}</p>
                        <div class="w-full md:max-w-1/3 md:h-20 sm:max-h-16 sm:ml-3 overflow-hidden rounded">
                            <MqOgImage :url="nextArticle.eyecatch?.url" :content-id="nextArticle.id" :title="nextArticle.title"
                                class="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>
            </NuxtLink>
            <div v-else class="flex-1">
                <div class="p-3 sm:p-4 h-full">
                    <div class="flex items-center justify-end text-gray-400 mb-2">
                        <span class="text-xs sm:text-sm">次の記事</span>
                        <Icon name="material-symbols:arrow-forward" class="ml-1 w-4 h-4" />
                    </div>
                    <p class="text-gray-400 font-medium text-right text-sm sm:text-base">これが最新の記事です</p>
                </div>
            </div>
        </div>
        <MqRssCta type="inline" />
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

/* スケルトン */
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}
</style>
