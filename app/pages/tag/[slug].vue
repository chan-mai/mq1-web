<script setup lang="ts">
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '#shared/types/microccms';

definePageMeta({
    middleware: ['tag-compatibility-redirect'],
});


const client = useMicroCMSClient();
const route = useRoute();
const router = useRouter();
const { slug } = route.params as { slug: string };
const page = computed(() => Number(route.query.page) || 1);
const limit = 12;


const articles: Ref<MicroCMSObject<Article>[] | null> = ref(null);
const totalCount: Ref<number> = ref(0);
const tag: Ref<MicroCMSObject<Tag> | null> = ref(null);

// slugからtagを取得
const { data: tagResponse } = await useAsyncData<MicroCMSObject<Tag>>(`tag-${slug}`, async () => {
    return await client.getList<MicroCMSObject<Tag>>({
        endpoint: 'tags',
        queries: {
            limit: 1,
            filters: `slug[equals]${slug}`,
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});

// タグが存在しない場合は404エラーを投げる
if (!tagResponse.value || tagResponse.value.contents.length === 0) {
    throw createError({
        statusCode: 404,
        statusMessage: `Tag not found: ${slug}`,
        fatal: true
    });
}

tag.value = tagResponse.value.contents[0];

// slugが存在し、かつ現在のパスがslugでない場合はリダイレクト
if (tag.value.slug && tag.value.slug !== slug) {
    await navigateTo(`/tag/${tag.value.slug}`, {
        redirectCode: 301,
      // tip: external指定なしではコケることがある
      external: true,
    });
}

const { data: articlesResponse, status } = await useAsyncData(
    () => `tag-${slug}-articles-${page.value}`,
    async () => {
        return await client.getList<Article>({
            endpoint: 'articles',
            queries: {
                limit: limit,
                offset: (page.value - 1) * limit,
                filters: `tags[contains]${tag.value.id}`,
            } satisfies MicroCMSQueries,
        });
    },
    {
        watch: [page],
        server: true,
    }
);

watch(articlesResponse, (newVal) => {
    if (newVal) {
        articles.value = newVal.contents as unknown as MicroCMSObject<Article>[];
        totalCount.value = newVal.totalCount;
    } else {
        // 記事がなければ空配列を設定しておく
        articles.value = [];
        totalCount.value = 0;
    }
}, { immediate: true });

const onPageChange = (newPage: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push({ query: { ...route.query, page: newPage } });
};

const config = useWebConfig();
const pageTitle = `#${tag.value?.name} - ${config.value.siteName}`;
const pageDescription = `#${tag.value?.name}の記事一覧`;
const ogImageUrl = useTagOgGenerator(`#${tag.value?.name}`);
const pageUrl = `${config.value.siteUrl}tag/${tag.value?.slug}`;

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

// 構造化データ (JSON-LD)
useJsonld({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: config.value.siteName,
    description: pageDescription,
    url: pageUrl,
    author: {
        '@type': 'Person',
        name: config.value.author.name,
        url: pageUrl,
    },
    blogPost: articles.value?.map((article: MicroCMSObject<Article>) => ({
        '@type': 'BlogPosting',
        headline: article.title,
        url: `${config.value.siteUrl}entry/${article.id}`,
        datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
        image: article.eyecatch?.url || config.value.baseOgpUrl,
        author: {
            '@type': 'Person',
            name: config.value.author.name,
            url: pageUrl,
        },
    })) || []
});
</script>
<template>
    <main
        class="min-h-screen pt-[120px] md:pt-[160px]">
        <!-- 直近記事 -->
        <section class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-2 md:px-6">
            <div class="flex items-center justify-between">
                <div class="w-full">
                    <MqPageBack class="mb-3" />
                    <div class="flex items-center justify-between">
                        <h2 class="font-accent text-3xl text-slate-800 md:text-4xl" :style="`view-transition-name: tag-${slug};`">
                                <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">
                                    #{{ tag?.name }}
                                </span>
                                の記事一覧
                            </h2>

                        <span class="text-slate-500 text-sm">全{{ totalCount }}記事</span>
                    </div>
                </div>
            </div>
            <div class="flex flex-col gap-8">
                <MqLoading v-if="status === 'pending'" />
                <template v-else>
                    <div v-if="articles?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ArticlesCard 
                            v-for="article in articles" 
                            :key="article.id" 
                            :article="article" 
                        />
                    </div>
                    <div v-else class="flex flex-col items-center justify-center gap-4 py-16">
                        <p class="text-lg font-bold text-accent">記事が見つかりませんでした。</p>
                        <p class="text-sm text-slate-500">他のタグを試してみてください。</p>
                    </div>

                    <MqPagination
                        v-if="totalCount > limit"
                        :total-count="totalCount"
                        :current-page="page"
                        :limit="limit"
                        @change="onPageChange"
                    />
                </template>
            </div>
        </section>
    </main>
</template>
