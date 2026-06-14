<script setup lang="ts">


const tags: Ref<Tag[] | null> = ref(null);
const articles: Ref<Article[] | null> = ref(null);
const pinnedArticles: Ref<Article[] | null> = ref(null);

const client = useMicroCMSClient();

// globalから固定記事を取得
const { data: globalResponse } = await useAsyncData<Global>('global', async () => {
    return await client.getObject<Global>({
        endpoint: 'global',
        queries: {
            depth: 2,
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});

// 50件のタグを取得
const { data: tagsResponse } = await useAsyncData('index-tags', async () => {
    return await client.getList<Tag>({
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
const { data: articlesResponse } = await useAsyncData('index-articles', async () => {
    return await client.getList<Article>({
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

const regularArticles = computed(() => {
    const pinnedIds = new Set(
        (globalResponse.value?.pinned_articles ?? []).map((a: any) => a.id)
    );
    return (articles.value ?? []).filter(a => !pinnedIds.has(a.id));
});

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
        blogPost: articles.value?.map((article: Article) => ({
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

const interestTags = ['engineering', 'creative', 'cats', 'pastel'];
</script>
<template>
    <main class="max-w-none text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0">
        <MqHero />

        <!-- ─── メインコンテンツ ─── -->
        <div class="mx-auto max-w-7xl px-6 pb-20 mt-10 md:mt-14">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

                <!-- Main Content -->
                <div class="lg:col-span-9 order-2 lg:order-1 space-y-16">
                    <section class="flex flex-col gap-8">
                        <!-- セクションヘッダー -->
                        <div class="flex items-center justify-between border-b border-border-subtle pb-4">
                            <h2 class="font-accent text-3xl font-bold text-fg md:text-4xl lg:text-5xl border-l-2 border-primary pl-3">
                                Articles
                            </h2>
                            <MqAppLink to="/articles/">
                                <span class="text-xs">すべての記事をみる</span>
                            </MqAppLink>
                        </div>

                        <div class="flex flex-col gap-10">
                            <p class="text-sm leading-relaxed text-fg-muted">
                                日常から非日常まで、書きたいことを自由に書いていく雑記帳です。</p>

                            <!-- 固定記事エリア -->
                            <div v-if="globalResponse?.pinned_articles" class="w-full">
                                <p class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-fg-muted">
                                    <Icon name="lucide:pin" class="h-3.5 w-3.5" />
                                    Pinned
                                </p>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <ArticlesCard
                                        v-for="article in globalResponse.pinned_articles"
                                        :key="article.id"
                                        :article="article"
                                        variant="pinned"
                                        :transition="true"
                                        :tag-transition="false"
                                    />
                                </div>
                            </div>

                            <!-- 通常記事エリア -->
                            <div v-if="regularArticles.length" class="w-full">
                                <p class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-fg-muted">
                                    <Icon name="lucide:notebook-pen" class="h-3.5 w-3.5" />
                                    Archives
                                </p>
                                <div class="-mx-4 md:mx-0">
                                    <Articles limit="5" :articles="regularArticles" :loading="false" :transition="true" :tag-transition="false" />
                                </div>
                            </div>
                            <div v-else class="flex flex-col items-center justify-center gap-4 py-10 bg-surface-muted rounded-lg">
                                <p class="text-lg font-bold text-accent">記事が見つかりませんでした。</p>
                                <p class="text-sm text-fg-muted">初めての投稿をお待ちください。</p>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Sidebar -->
                <aside class="lg:col-span-3 order-1 lg:order-2 space-y-10 lg:sticky lg:top-36">

                    <!-- プロフィールカード -->
                    <section>
                        <div class="flex items-center justify-between mb-3">
                            <p class="text-xs font-semibold tracking-widest uppercase text-fg-muted">Profile</p>
                            <MqAppLink to="/about">
                                <span class="text-xs">詳細</span>
                            </MqAppLink>
                        </div>

                        <div class="rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden shadow-sm">
                            <!-- トップアクセントライン -->
                            <div class="h-0.5 bg-primary" />

                            <div class="p-4 space-y-3">
                                <!-- アバター + 名前 -->
                                <div class="flex items-center gap-3">
                                    <div class="size-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                                        <span class="text-white text-xl font-bold font-accent select-none">ま</span>
                                    </div>
                                    <div>
                                        <h3 class="text-sm font-bold text-fg leading-snug">
                                            月出里 まい
                                            <span class="waving-hand ml-0.5">👋🏻</span>
                                        </h3>
                                        <p class="text-[11px] text-fg-muted mt-0.5">chan-mai · SUDACHI MAI</p>
                                    </div>
                                </div>

                                <!-- 区切り線 -->
                                <div class="border-t border-border-subtle" />

                                <!-- 略歴 -->
                                <p class="text-xs leading-6 text-fg-muted">
                                    コードを書いたり、絵を描いたり、映像をつくったりしている多趣味なエンジニア。猫とパステルとかわいいものがすき🐈
                                </p>

                                <!-- インタレストタグ -->
                                <div class="flex flex-wrap gap-1.5">
                                    <span v-for="tag in interestTags" :key="tag"
                                          class="rounded-full border border-border-subtle text-fg-muted px-2.5 py-0.5 text-[10px]">
                                        {{ tag }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Tags -->
                    <section class="flex flex-col gap-4">
                        <p class="text-xs font-semibold tracking-widest uppercase text-fg-muted">Tags</p>
                        <div v-if="tags && tags.length > 0" class="flex flex-wrap gap-2">
                            <MqTag v-for="tag in tags" :key="tag.id" :tag="tag" transition />
                        </div>
                        <div v-else class="text-center text-fg-muted text-sm">
                            <p>タグがありません</p>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    </main>
</template>
