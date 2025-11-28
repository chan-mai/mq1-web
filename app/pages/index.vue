<script setup lang="ts">
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '#shared/types/microccms';


const tags: Ref<MicroCMSObject<Tag>[] | null> = ref(null);
const articles: Ref<MicroCMSObject<Article>[] | null> = ref(null);

const client = useMicroCMSClient();

// 50件のタグを取得
const { data: tagsResponse } = await useAsyncData<MicroCMSObject<Tag[]>>('index-tags', async () => {
    return await client.getList<MicroCMSObject<Tag[]>>({
        endpoint: 'tags',
        queries: {
            limit: 50,
            orders: '-publishedAt',
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});
if (tagsResponse.value) tags.value = tagsResponse.value.contents;

// 直近15件の記事を取得
const { data: articlesResponse } = await useAsyncData<MicroCMSObject<Article[]>>('index-articles', async () => {
    return await client.getList<MicroCMSObject<Article[]>>({
        endpoint: 'articles',
        queries: {
            limit: 15,
            orders: '-publishedAt',
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});
if (articlesResponse.value) articles.value = articlesResponse.value.contents;

const config = useWebConfig();
const pageTitle = config.value.siteName;
const pageDescription = config.value.siteDescription;
const pageUrl = config.value.siteUrl;

useHead({
    title: pageTitle,
    meta: [
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDescription },
        { property: 'og:image', content: `${config.value.baseOgpUrl}` },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: pageUrl },
        { property: 'og:site_name', content: config.value.siteName },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'description', content: pageDescription },
    ],
});

// 構造化データ (JSON-LD)
useJsonld([
    {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: config.value.siteName,
        description: pageDescription,
        url: pageUrl,
        inLanguage: 'ja',
        publisher: {
            '@type': 'Person',
            name: config.value.author.name,
            url: pageUrl,
        }
    },
    {
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
    }
]);

</script>
<template>
    <main
        class="max-w-none text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0 max-w-7xl gap-16 md:gap-20 space-y-16">
        <MqHero />

        <!-- About Me -->
        <section class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-2 md:px-6">
            <div class="flex items-center justify-between">
                <h2 class="text-head font-accent text-4xl font-bold text-slate-800 md:text-6xl">
                    About Me
                </h2>
                <MqAppLink to="/about">
                    <span class="text-xs">もっとみる</span>
                </MqAppLink>
            </div>
            <div>
                <h3
                    class="text-hey mb-4 max-w-2xl text-2xl leading-none md:text-3xl xl:text-4xl text-primary">
                    Hey, I'm
                    <span
                        class="text-hey bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">chan-mai</span>
                    <span class="waving-hand">👋🏻</span>
                </h3>
                <p class="mt-2.5 text-sm leading-relaxed first:mt-0">ちゃんまいです。コードを書いたり、絵を描いたり、映像をつくったりしている多趣味なエンジニア。</p>
                <p class="mt-2.5 text-sm leading-relaxed first:mt-0">猫とパステルとかわいいものがすき。</p>
            </div>
        </section>

        <!-- 直近記事 -->
        <section class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-2 md:px-6">
            <div class="flex items-center justify-between">
                <h2 class="text-head font-accent text-4xl font-bold text-slate-800 md:text-6xl">
                    Blogs
                </h2>
                <MqAppLink to="/articles/">
                    <span class="text-xs">もっとみる</span>
                </MqAppLink>
            </div>
            <div class="flex flex-col gap-8">
                <p class="text-sm leading-relaxed">
                    日常から非日常まで、書きたいことを自由に書いていく雑記帳です。</p>

                <Tags :tags="tags || []" />
                <Articles v-if="articles" limit="5" :articles :loading="false" transition />
                <div v-else class="flex flex-col items-center justify-center gap-4">
                    <p class="text-lg font-bold text-accent">記事が見つかりませんでした。</p>
                    <p class="text-sm text-slate-500">初めての投稿をお待ちください。</p>
                </div>
            </div>
        </section>
    </main>
</template>
