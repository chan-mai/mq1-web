<script setup lang="ts">
const props = defineProps({
    currentArticle: {
        type: Object as () => Article,
        required: true,
    },
});

const isLoaded: Ref<boolean> = ref(false);

const prevArticle: Ref<Article | null> = ref(null);
const nextArticle: Ref<Article | null> = ref(null);

// 前と次の記事を並列で取得
Promise.all([
    // ひとつ前の記事を取得
    useFetch(() => `/api/article/${props.currentArticle.id}?prev=true`).then(({ data, status, error }) => {
        if (error.value && error.value.statusCode !== 404) {
            // 前後の投稿は存在しない状態が起こりうるので404をハンドリングしない
            console.error('Error fetching previous article:', error.value);
            showError({
                statusCode: 500,
                message: 'Internal Server Error',
                fatal: true,
            });
        }

        if (status.value === "success") {
            prevArticle.value = data.value?.body as unknown as Article;
            // サマリーの生成
            prevArticle.value!.summary = useSummaryTextGenerator(prevArticle.value!.content!);
            // preload
            preloadRouteComponents(`/entry/${prevArticle.value!.id}`)
        }
    }).catch(error => {
        console.error('Error fetching previous article:', error);
    }),

    // 次の記事を取得
    useFetch(() => `/api/article/${props.currentArticle.id}?next=true`).then(({ data, status, error }) => {
        if (error.value && error.value.statusCode !== 404) {
            // 前後の投稿は存在しない状態が起こりうるので404をハンドリングしない
            console.error('Error fetching next article:', error.value);
            showError({
                statusCode: 500,
                message: 'Internal Server Error',
                fatal: true,
            });
        }

        if (status.value === "success") {
            nextArticle.value = data.value?.body as unknown as Article;
            // サマリーの生成
            nextArticle.value!.summary = useSummaryTextGenerator(nextArticle.value!.content!);
            // preload
            preloadRouteComponents(`/entry/${nextArticle.value!.id}`)
        }
    }).catch(error => {
        console.error('Error fetching next article:', error);
    }),


]).finally(() => {
    isLoaded.value = true;
});
</script>
<template>
    <div class="max-w-6xl mx-auto px-4 mb-8 sm:mb-16 border-t border-gray-200 pt-4 sm:pt-8">
        <div class="flex flex-col md:flex-row justify-between gap-4 sm:gap-6">
            <template v-if="isLoaded">
                <!-- 前の記事 -->
                <NuxtLink v-if="prevArticle" :to="`/entry/${prevArticle.id}`" class="slide-hover flex-1">
                    <div
                        class="group p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-primary transition-all duration-300 h-full">
                        <div class="flex items-center text-gray-500 mb-2">
                            <Icon name="material-symbols:arrow-back" class="mr-1 w-4 h-4 group-hover:text-primary" />
                            <span class="text-xs sm:text-sm group-hover:text-primary">前の記事</span>
                        </div>
                        <h4 class="text-gray-800 text-sm sm:text-base font-medium line-clamp-1 overflow-hidden text-ellipsis">{{ prevArticle.title }}</h4>
                        <div class="mt-2 flex flex-col sm:flex-row items-center">
                            <div
                                class="w-full md:max-w-1/3 aspect-video md:h-20 sm:max-h-16 mb-2 sm:mb-0 sm:mr-3 overflow-hidden rounded">
                                <MqOgImage :url="prevArticle.eyecatch?.url" :title="prevArticle.title"
                                    class="w-full h-full object-contain" />
                            </div>
                            <p class="text-xs sm:text-sm text-gray-600 overflow-hidden line-clamp-2 sm:line-clamp-3">{{ prevArticle.summary || '' }}</p>
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
                        <h4 class="text-gray-800 text-sm sm:text-base font-medium line-clamp-1 overflow-hidden text-ellipsis text-right">{{ nextArticle.title }}</h4>
                        <div class="mt-2 flex flex-col-reverse sm:flex-row items-center">
                            <p class="text-xs sm:text-sm text-gray-600 overflow-hidden line-clamp-2 sm:line-clamp-3 mt-2 sm:mt-0">{{ nextArticle.summary || '' }}</p>
                            <div
                                class="w-full md:max-w-1/3 aspect-video md:h-20 sm:max-h-16 sm:ml-3 overflow-hidden rounded">
                                <MqOgImage :url="nextArticle.eyecatch?.url" :title="nextArticle.title"
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
            </template>

            <!-- スケルトンローディング (モバイル対応) -->
            <template v-else>
                <!-- 前の記事 -->
                <div class="flex-1">
                    <div class="group p-3 sm:p-4 border border-gray-200 rounded-lg h-full">
                        <div class="flex items-center text-gray-500 mb-2">
                            <div class="skeleton w-4 h-4 mr-1"></div>
                            <div class="skeleton w-12 sm:w-16 h-3 sm:h-4"></div>
                        </div>
                        <div class="skeleton w-full h-4 sm:h-6 mb-2"></div>
                        <div class="mt-2 flex flex-col sm:flex-row items-center">
                            <div class="w-full sm:max-w-1/3 aspect-video h-20 sm:max-h-16 mb-2 sm:mb-0 sm:mr-3 overflow-hidden rounded">
                                <div class="skeleton w-full h-full"></div>
                            </div>
                            <div class="flex-1 w-full">
                                <div class="skeleton w-full h-3 sm:h-4 mb-1"></div>
                                <div class="skeleton w-3/4 h-3 sm:h-4"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 次の記事 -->
                <div class="flex-1">
                    <div class="group p-3 sm:p-4 border border-gray-200 rounded-lg h-full">
                        <div class="flex items-center justify-end text-gray-500 mb-2">
                            <div class="skeleton w-12 sm:w-16 h-3 sm:h-4"></div>
                            <div class="skeleton w-4 h-4 ml-1"></div>
                        </div>
                        <div class="skeleton w-full h-4 sm:h-6 mb-2 ml-auto"></div>
                        <div class="mt-2 flex flex-col-reverse sm:flex-row items-center">
                            <div class="flex-1 w-full mt-2 sm:mt-0">
                                <div class="skeleton w-full h-3 sm:h-4 mb-1"></div>
                                <div class="skeleton w-3/4 h-3 sm:h-4 ml-auto"></div>
                            </div>
                            <div class="w-full sm:max-w-1/3 aspect-video h-20 sm:max-h-16 sm:ml-3 overflow-hidden rounded">
                                <div class="skeleton w-full h-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
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
