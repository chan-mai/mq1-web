<script setup lang="ts">
const props = defineProps({
    limit: {
        type: String,
        default: "0",
    },
    articles: {
        type: Array as () => Article[],
        default: () => [],
    },
})
const limit = props.limit as unknown as number;

const limitedArticles = computed(() => {
    return limit > 0
        ? props.articles.slice(0, limit)
        : props.articles;
});

// タグをクリックした時の処理
const router = useRouter();
function navigateToTag(tag: any) {
    // タグページへ遷移（タグでフィルタリングされた一覧ページなど）
    router.push(`/tag/${tag.id}`);
}
</script>

<template>
    <div class="max-w-6xl mx-auto p-4">
        <div class="relative">
            <div class="absolute left-[14px] top-0 bottom-0 w-[1px] bg-gray-300"></div>

            <!-- Articles -->
            <div class="space-y-8">
                <div v-for="(article, index) in limitedArticles" :key="index" class="relative">
                    <div :class="`absolute left-0 top-0 flex items-center justify-center w-7 h-7 rounded-full z-10 
                ${index === 0 ? 'bg-primary' : 'border-2 border-primary bg-white'}`">
                        <span class="text-xs text-gray-500"></span>
                    </div>

                    <!-- Content -->
                    <NuxtLink :to="`/entry/${article.id}`">
                        <div class="flex flex-col md:flex-row md:items-start pl-10 pb-8">
                            <div
                                class="text-sm text-gray-600 mb-2 md:mb-0 md:mr-4 md:w-24 md:flex-shrink-0 md:text-right">
                                {{
                                    new Date(article.publishedAt! ?? article.createdAt!).toLocaleString('ja-JP', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        timeZone: 'Asia/Tokyo',
                                    })
                                }}
                            </div>

                            <div class="slide-hover p-4 rounded-lg flex-grow overflow-hidden">
                                <!-- 以下のdivをフレックスレイアウトに変更し、画像とコンテンツを横並びにする -->
                                <div class="flex flex-col md:flex-row gap-4 h-full">
                                    <!-- 画像コンテナ - モバイルでは幅100%、md以上では固定幅 -->
                                    <div class="md:w-1/3 w-full">
                                        <div class="relative h-48 md:h-full w-full overflow-hidden rounded-lg aspect-video max-w-full">
                                            <MqOgImage :url="article.eyecatch?.url" :title="article.title" fill
                                                class="object-cover transition-transform duration-300 hover:scale-105 rounded-lg w-full h-full"
                                                :style="`view-transition-name: article-${article.id}; max-width: 100%;`"/>
                                        </div>
                                    </div>
                                    
                                    <!-- テキストコンテンツ -->
                                    <div class="md:w-2/3 w-full flex flex-col justify-between h-full">
                                        <div>
                                            <h3 class="text-lg font-medium text-gray-800 mb-2">{{ article.title }}</h3>
                                            <p class="text-gray-600 text-sm mb-2">{{ article.summary }}</p>

                                            <div class="flex flex-wrap gap-2 mt-4">
                                                <MqTag v-for="tag in article.tags!.slice(0, 5)" :key="tag.id" :tag="tag"
                                                    @click.stop.prevent="navigateToTag(tag)" />
                                            </div>
                                        </div>

                                        <div class="w-full flex justify-end pt-4">
                                            <NuxtLink :to="`/entry/${article.id}`"
                                                class="text-accent text-sm inline-flex items-center">
                                                続きを読む
                                                <Icon name="material-symbols:arrow-circle-right-outline" class="w-5 h-5" />
                                            </NuxtLink>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </NuxtLink>
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

@media (max-width: 768px) {
  .aspect-video {
    max-width: 100%;
    height: auto !important;
  }
}
</style>
