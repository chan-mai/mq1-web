<script setup lang="ts">
const articlesLoading: Ref<boolean> = ref(true);
const articles: Ref<Article[] | null> = ref(null);

// とりあえず直近100件の記事を取得
// TODO: ページネーションとかつくる
async function fetchArticles() {
    try {
        const { data, status, error } = await useFetch(() => `/api/articles?limit=100`);

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
            articles.value = data.value?.body as unknown as Article[];
        }
    } catch (error) {
        console.error('Error fetching articles:', error);
        showError({
            statusCode: 500,
            message: "Internal Server Error",
            fatal: true,
        });
    } finally {
        articlesLoading.value = false;
    }
}

// 各読み込み
fetchArticles();

const config = useWebConfig();
const pageTitle = `記事一覧 - ${config.value.siteName}`;
const pageDescription = config.value.siteDescription;
const ogImageUrl = useOgGenerator('記事一覧');
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
                <h2 class="font-accent text-3xl font-bold text-slate-800 md:text-4xl">
                    記事一覧
                </h2>
            </div>
            <div class="flex flex-col gap-8">
                <Articles v-if="articles" :articles :loading="articlesLoading" />
                <!--ロード完了までは記事なしを確定しない-->
                <div v-else-if="!articlesLoading" class="flex flex-col items-center justify-center gap-4">
                    <p class="text-lg font-bold text-accent">記事が見つかりませんでした。</p>
                    <p class="text-sm text-slate-500">初めての投稿をお待ちください。</p>
                </div>
            </div>
        </section>
    </main>
</template>
