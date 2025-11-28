<script setup lang="ts">
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '#shared/types/microccms';

const articles: Ref<MicroCMSObject<Article>[] | null> = ref(null);

const client = useMicroCMSClient();
// とりあえず直近100件の記事を取得
const { data: articlesResponse } = await useAsyncData<MicroCMSObject<Article[]>>('articles', async () => {
    return await client.getList<MicroCMSObject<Article[]>>({
        endpoint: 'articles',
        queries: {
            limit: 100,
            orders: '-publishedAt',
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});
if ( articlesResponse.value ) articles.value = articlesResponse.value.contents;


const config = useWebConfig();
const pageTitle = `記事一覧 - ${config.value.siteName}`;
const pageDescription = config.value.siteDescription;
const ogImageUrl = config.value.baseOgpUrl;
const pageUrl = `${config.value.siteUrl}articles`;

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
        class="max-w-none h-full text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0 max-w-7xl gap-16 md:gap-20 space-y-16">
        <MqHero />

        <!-- 直近記事 -->
        <section class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-2 md:px-6">
            <div class="flex items-center justify-between">
                <h2 class="font-accent text-3xl text-slate-800 md:text-4xl">
                    記事一覧
                </h2>
            </div>
            <div class="flex flex-col gap-8">
                <div v-if="articles" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ArticlesCard 
                        v-for="article in articles" 
                        :key="article.id" 
                        :article="article" 
                    />
                </div>
                <div v-else class="flex flex-col items-center justify-center gap-4">
                    <p class="text-lg font-bold text-accent">記事が見つかりませんでした。</p>
                    <p class="text-sm text-slate-500">初めての投稿をお待ちください。</p>
                </div>
            </div>
        </section>
    </main>
</template>
