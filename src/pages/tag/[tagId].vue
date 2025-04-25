<script setup lang="ts">
const route = useRoute();
const { tagId } = route.params as { tagId: string };


const articles: Ref<Article[] | null> = ref(null);
const tag: Ref<Tag | null> = ref(null);
const articlesLoading: Ref<boolean> = ref(true);

// tagIdからtagを取得
try {
    const { data, status, error } = await useFetch(() => `/api/tag/${tagId}`);

    if (error.value) {
        console.error('Error fetching article:', error.value);
        // 404
        if (error.value.statusCode === 404) {
            showError({
                statusCode: 404,
                message: 'Article not found',
                fatal: true,
            });
        } else {
            showError({
                statusCode: 500,
                message: 'Internal Server Error',
                fatal: true,
            });
        }
    }

    if (status.value === "success") {
        tag.value = data.value?.body as unknown as Tag;
    }
} catch (error) {
    console.error('Error fetching tag:', error);
}

// とりあえずタグをソースに直近100件の記事を取得
// TODO: ページネーションとかつくる
async function fetchArticles() {
    try {
        const { data, status, error } = await useFetch(() => `/api/articles?limit=100&tag_id=${tagId}`);

        if (error.value) {
            console.error('Error fetching article:', error.value);
        }

        if (status.value === "success") {
            articles.value = data.value?.body as unknown as Article[];
        }
    } catch (error) {
        console.error('Error fetching articles:', error);
    } finally {
        articlesLoading.value = false;
    }
}
// 各読み込み
fetchArticles();


const config = useWebConfig();
const pageTitle = `#${tag.value?.name} - ${config.value.siteName}`;
const pageDescription = config.value.siteDescription;
const ogImageUrl = useOgGenerator(`#${tag.value?.name}`);
const pageUrl = `${config.value.siteUrl}/articles`;

useHead({
    title: pageTitle,
    meta: [
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDescription },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: pageUrl },
        { property: 'og:site_name', content: config.value.siteName },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'description', content: pageDescription },
    ],
});
</script>
<template>
    <main
        class="max-w-none h-full text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0 max-w-7xl gap-16 md:gap-20 space-y-16">
        <MqHero />

        <!-- 直近記事 -->
        <section class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-2 md:px-6">
            <div class="flex items-center justify-between">
                <div>
                    <Button class="inline-flex items-center gap-x-1 text-sm text-gray-800 hover:text-primary mb-3"
                        @click="$router.back()">
                        <svg class="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        前のページへ戻る
                    </Button>
                    <h2 class="font-accent text-3xl font-bold text-slate-800 md:text-4xl" :style="`view-transition-name: tag-${tagId};`">
                        <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">
                            #{{ tag?.name }}
                        </span>
                        の記事一覧
                    </h2>
                </div>
            </div>
            <div class="flex flex-col gap-8">
                <Articles v-if="articles" :articles :loading="articlesLoading"/>
                <div v-else class="flex flex-col items-center justify-center gap-4">
                    <p class="text-lg font-bold text-accent">記事が見つかりませんでした。</p>
                    <p class="text-sm text-slate-500">他のタグを試してみてください。</p>
                </div>
            </div>
        </section>
    </main>
</template>
