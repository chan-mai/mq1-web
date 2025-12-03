<script setup lang="ts">
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '#shared/types/microccms';

definePageMeta({
    middleware: ['tag-compatibility-redirect'],
});


const client = useMicroCMSClient();
const route = useRoute();
const { slug } = route.params as { slug: string };


const articles: Ref<MicroCMSObject<Article>[] | null> = ref(null);
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

// とりあえずタグをソースに直近100件の記事を取得
// TODO: ページネーションとかつくる
const { data: articlesResponse } = await useAsyncData<MicroCMSObject<Article[]>>(`tag-${slug}-articles`, async () => {
    return await client.getList<MicroCMSObject<Article[]>>({
        endpoint: 'articles',
        queries: {
            limit: 100,
            filters: `tags[contains]${tag.value.id}`,
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});

// 記事が存在しない場合は空配列を設定
if (articlesResponse.value) {
    articles.value = articlesResponse.value.contents;
} else {
    articles.value = [];
}

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
        class="max-w-none h-full text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0 max-w-7xl gap-16 md:gap-20 space-y-16">
        <MqHero :tag-id="slug" :title="tag?.name" text-hidden />

        <!-- 直近記事 -->
        <section class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-2 md:px-6">
            <div class="flex items-center justify-between">
                <div>
                    <MqPageBack class="mb-3" />
                    <h2 class="font-accent text-3xl text-slate-800 md:text-4xl" :style="`view-transition-name: tag-${slug};`">
                        <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">
                            #{{ tag?.name }}
                        </span>
                        の記事一覧
                    </h2>
                </div>
            </div>
            <div class="flex flex-col gap-8">
                <div v-if="articles" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </div>
        </section>
    </main>
</template>
