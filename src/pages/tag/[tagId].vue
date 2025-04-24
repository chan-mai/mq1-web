<script setup lang="ts">
const route = useRoute();
const { tagId } = route.params as { tagId: string };

const isLoaded: Ref<boolean> = ref(false);

const { data: articlesData } = await useAsyncData('articles', async () => {
    const { data } = await useMicroCMSGetList<Article[]>({
        endpoint: 'articles',
        queries: {
            limit: 5,
            filters: `tags[contains]${tagId}`,
            orders: '-publishedAt',
        },
    });
    return data.value?.contents;
});
const { data: tagsData } = await useAsyncData('tags', async () => {
    const { data } = await useMicroCMSGetList<Tag[]>({
        endpoint: 'tags',
        queries: {
            limit: 1,
            filters: `id[contains]${tagId}`,
            orders: '-publishedAt',
        },
    });
    return data.value?.contents;
});

const articles = computed(() => articlesData.value || []);
const tagName = computed(() => {
    // tagsDataには、tagIdに一致するタグが1つだけ存在することを前提としています。
    const tag = tagsData.value?.[0];
    if (tag) {
        isLoaded.value = true;
        return (tag as Tag).name;
    } else {
        showError({
            statusCode: 404,
            message: 'Tag not found',
            fatal: true,
        });
    }

});

const config = useWebConfig();
const pageTitle = `#${tagName} - ${config.value.siteName}`;
const pageDescription = config.value.siteDescription;
const ogImageUrl = useOgGenerator(`#${tagName}`);
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
                    <h2 class="font-accent text-3xl font-bold text-slate-800 md:text-4xl">
                        <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">
                            #{{ tagName }}
                        </span>
                        の記事一覧
                    </h2>
                </div>
            </div>
            <div class="flex flex-col gap-8">
                <Articles v-if="articles.length > 0" :articles />
                <div v-else class="flex flex-col items-center justify-center gap-4">
                    <p class="text-lg font-bold text-accent">記事が見つかりませんでした。</p>
                    <p class="text-sm text-slate-500">他のタグを試してみてください。</p>
                </div>
            </div>
        </section>
    </main>
</template>
