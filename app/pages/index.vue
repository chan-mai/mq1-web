<script setup lang="ts">
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '#shared/types/microccms';


const tags: Ref<MicroCMSObject<Tag>[] | null> = ref(null);
const articles: Ref<MicroCMSObject<Article>[] | null> = ref(null);
const pinnedArticles: Ref<MicroCMSObject<Article>[] | null> = ref(null);

const client = useMicroCMSClient();

// globalから固定記事を取得
const { data: globalResponse } = await useAsyncData<MicroCMSObject<Global>>('global', async () => {
    return await client.getObject<MicroCMSObject<Global>>({
        endpoint: 'global',
        queries: {
            // tags要素にslug, nameを含めるため
            depth: 2,
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});

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
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: pageDescription },
        { name: 'twitter:image', content: `${config.value.baseOgpUrl}` },
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
        class="max-w-none text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0">
        <MqHero />

        <div class="mx-auto max-w-7xl px-6 sm:px-6 pb-20 mt-12 md:mt-16 lg:mt-20">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                <!-- Main Content -->
                <div class="lg:col-span-9 order-2 lg:order-1 space-y-16">
                    <!-- 直近記事 -->
                    <section class="flex flex-col gap-8">
                        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h2 class="font-accent text-3xl font-bold text-slate-800 md:text-4xl lg:text-5xl">
                                Articles
                            </h2>
                            <MqAppLink to="/articles/">
                                <span class="text-xs">すべての記事をみる</span>
                            </MqAppLink>
                        </div>
                        
                        <div class="flex flex-col gap-10">
                            <p class="text-sm leading-relaxed text-gray-600">
                                日常から非日常まで、書きたいことを自由に書いていく雑記帳です。</p>
            
                            <!-- 固定記事エリア -->
                            <div v-if="globalResponse?.pinned_articles" class="w-full">
                                <div class="mb-4 flex items-center gap-2 text-primary/80">
                                    <Icon name="lucide:pin" class="h-4 w-4" />
                                    <span class="font-semibold text-xs tracking-wider uppercase">Pinned</span>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ArticlesCard 
                                        v-for="article in globalResponse.pinned_articles" 
                                        :key="article.id" 
                                        :article="article" 
                                        variant="compact"
                                        :transition="true"
                                        :tag-transition="false"
                                    />
                                </div>
                            </div>
            
                            <!-- 通常記事エリア -->
                            <div v-if="articles" class="w-full">
                                <div class="mb-4 flex items-center gap-2 text-primary/80">
                                    <Icon name="lucide:book-open" class="h-4 w-4" />
                                    <span class="font-semibold text-xs tracking-wider uppercase">Archives</span>
                                </div>
                                <!-- Articlesコンポーネント周りの余白を調整 -->
                                <div class="-mx-4 md:mx-0">
                                    <Articles v-if="articles" limit="5" :articles :loading="false" :transition="true" :tag-transition="false" />
                                </div>
                            </div>
                            <div v-else class="flex flex-col items-center justify-center gap-4 py-10 bg-gray-50 rounded-lg">
                                <p class="text-lg font-bold text-accent">記事が見つかりませんでした。</p>
                                <p class="text-sm text-slate-500">初めての投稿をお待ちください。</p>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Sidebar -->
                <aside class="lg:col-span-3 order-1 lg:order-2 space-y-12 lg:sticky lg:top-36">
                    <!-- About Me -->
                    <section class="flex flex-col gap-6">
                        <div class="flex items-center justify-between">
                            <h2 class="flex items-center justify-center gap-2 text-primary text-2xl font-semibold">
                                <Icon name="lucide:user" class="size-5" />
                                <span class="decoration-primary/40 underline">About Me</span>
                            </h2>
                            <MqAppLink to="/about">
                                <span class="text-xs">詳細</span>
                            </MqAppLink>
                        </div>
                        <div>
                            <h3 class="mb-3 text-xl font-bold text-primary">
                                Hey, I'm
                                <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">chan-mai</span>
                                <span class="waving-hand ml-1">👋🏻</span>
                            </h3>
                            <p class="text-sm leading-7 text-gray-600">
                                ちゃんまいです。コードを書いたり、絵を描いたり、映像をつくったりしている多趣味なエンジニア。<br>
                                猫とパステルとかわいいものがすき🐈
                            </p>
                        </div>
                    </section>

                    <!-- Tags -->
                    <section class="flex flex-col gap-6 rounded-2xl">
                        <div class="flex items-center justify-between">
                            <h2 class="flex items-center justify-center gap-2 text-primary text-2xl font-semibold">
                                <Icon name="lucide:tags" class="size-5" />
                                <span class="decoration-primary/40 underline">Tags</span>
                            </h2>
                        </div>
                        <div class="text-sm leading-7 text-gray-600">
                            <div v-if="tags && tags.length > 0" class="flex flex-wrap gap-2">
                                <MqTag v-for="tag in tags" :key="tag.id" :tag="tag" transition />
                            </div>
                            <div v-else class="text-center text-gray-500 text-sm">
                                <p>タグがありません</p>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    </main>
</template>
