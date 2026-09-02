<script setup lang="ts">
definePageMeta({ headerInverse: true });

// 固定記事を取得
const { data: siteResponse } = await useFetch('/api/site', { key: 'site' });
const pinnedArticles = computed(() => siteResponse.value?.pinnedArticles ?? []);

// タグを取得
const { data: tagsResponse } = await useFetch('/api/tags', {
  key: 'index-tags',
});
const tags = computed(() => tagsResponse.value?.contents ?? []);

// 直近15件の記事を取得
const { data: articlesResponse } = await useFetch('/api/articles', {
  key: 'index-articles',
  query: { limit: 15 },
});
const articles = computed(() => articlesResponse.value?.contents ?? []);

const regularArticles = computed(() => {
  const pinnedIds = new Set(pinnedArticles.value.map((a) => a.id));
  return articles.value.filter((a) => !pinnedIds.has(a.id));
});

// スクロール出現演出
const pageRoot = ref<HTMLElement | null>(null);
useRevealAnimations(pageRoot);

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
    },
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
    blogPost:
      articles.value?.map((article: Article) => ({
        '@type': 'BlogPosting',
        headline: article.title,
        url: `${config.value.siteUrl}entry/${article.id}`,
        datePublished: article.publishedAt
          ? new Date(article.publishedAt).toISOString()
          : undefined,
        image: article.eyecatch?.url || config.value.baseOgpUrl,
        author: {
          '@type': 'Person',
          name: config.value.author.name,
          url: pageUrl,
        },
      })) || [],
  },
]);

const interestTags = ['engineering', 'creative', 'cats', 'pastel'];
</script>
<template>
  <main ref="pageRoot"
    class="max-w-none text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0">
    <MqHero />

    <!-- ─── メインコンテンツ ─── -->
    <div class="mx-auto max-w-7xl px-6 pb-20 mt-10 md:mt-14">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <!-- Main Content -->
        <div class="lg:col-span-9 order-2 lg:order-1 space-y-16">
          <section class="flex flex-col gap-8">
            <!-- セクションヘッダー -->
            <div class="flex items-center justify-between border-b border-border-subtle pb-4">
              <h2 data-fill-in class="font-accent w-fit text-3xl font-bold text-fg md:text-4xl lg:text-5xl">
                <span>Articles</span>
              </h2>
              <MqAppLink to="/articles/" data-fade-in>
                <span class="text-xs">すべての記事をみる</span>
              </MqAppLink>
            </div>

            <div class="flex flex-col gap-10">
              <p data-fade-in class="text-sm leading-relaxed text-fg-muted">
                日常から非日常まで、書きたいことを自由に書いていく雑記帳です。
              </p>

              <!-- 固定記事エリア -->
              <div v-if="pinnedArticles.length" class="w-full">
                <p data-fill-in
                  class="mb-4 flex w-fit items-center gap-2 text-xs font-semibold tracking-widest uppercase text-fg-muted">
                  <Icon name="lucide:pin" class="h-3.5 w-3.5" />
                  <span>Pinned</span>
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ArticlesCard v-for="(article, i) in pinnedArticles" :key="article.id" :article="article"
                    variant="pinned" :transition="true" :tag-transition="false" data-fade-in
                    :data-fade-delay="(i % 2) * 0.08" />
                </div>
              </div>

              <!-- 通常記事エリア -->
              <div v-if="regularArticles.length" class="w-full">
                <p data-fill-in
                  class="mb-4 flex w-fit items-center gap-2 text-xs font-semibold tracking-widest uppercase text-fg-muted">
                  <Icon name="lucide:notebook-pen" class="h-3.5 w-3.5" />
                  <span>Archives</span>
                </p>
                <div class="-mx-4 md:mx-0">
                  <Articles limit="5" :articles="regularArticles" :loading="false" :transition="true"
                    :tag-transition="false" />
                </div>
              </div>
              <div v-else class="flex flex-col items-center justify-center gap-4 py-10 bg-surface-muted rounded-lg">
                <p class="text-lg font-bold text-accent">
                  記事が見つかりませんでした。
                </p>
                <p class="text-sm text-fg-muted">
                  初めての投稿をお待ちください。
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar -->
        <aside class="lg:col-span-3 order-1 lg:order-2 space-y-10 lg:sticky lg:top-36">
          <!-- プロフィールカード -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <p data-fill-in class="font-futura w-fit text-xs font-semibold tracking-widest uppercase text-fg-muted">
                <span>Profile</span>
              </p>
              <MqAppLink to="/about">
                <span class="text-xs">詳細</span>
              </MqAppLink>
            </div>

            <div data-fade-in class="rounded-xl bg-surface-elevated overflow-hidden">
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
                    <p class="font-futura text-[11px] text-fg-muted mt-0.5">
                      chan-mai · SUDACHI MAI
                    </p>
                  </div>
                </div>

                <!-- 区切り線 -->
                <div class="border-t border-border-subtle" />

                <p class="text-xs leading-6 text-fg-muted">
                  コードを書いたり、絵を描いたり、映像をつくったりしている多趣味なエンジニア。猫とパステルとかわいいものがすき🐈
                </p>

                <!-- インタレストタグ -->
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="tag in interestTags" :key="tag"
                    class="font-futura rounded-full border border-border-subtle text-fg-muted px-2.5 py-0.5 text-[10px]">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Tags -->
          <section class="flex flex-col gap-4">
            <p data-fill-in class="font-futura w-fit text-xs font-semibold tracking-widest uppercase text-fg-muted">
              <span>Tags</span>
            </p>
            <div v-if="tags && tags.length > 0" data-fade-in class="flex flex-wrap gap-2">
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
