<script setup lang="ts">

const tags: Ref<Tag[] | null> = ref(null);
const articles: Ref<Article[] | null> = ref(null);

const articlesLoading: Ref<boolean> = ref(true);
const tagsLoading: Ref<boolean> = ref(true);

// すべてのタグを取得
async function fetchTags() {

    try {
        const { data, status, error } = await useFetch(() => `/api/tag/all`);

        if (error.value) {
            console.error('Error fetching tag:', error.value);
        }

        if (status.value === "success") {
            tags.value = data.value?.body as unknown[] as Tag[];
        }
    } catch (error) {
        console.error('Error fetching tag:', error);
    } finally {
        tagsLoading.value = false;

    }
}
// 直近5件の記事を取得
async function fetchArticles() {
    try {
        const { data, status, error } = await useFetch(() => `/api/articles?limit=5`);

        if (error.value) {
            console.error('Error fetching tag:', error.value);
        }

        if (status.value === "success") {
            articles.value = data.value?.body as unknown[] as Article[];

            // preload
            if (articles.value) {
                articles.value.forEach((article: Article) => {
                    preloadRouteComponents(`/entry/${article.id}`)
                })
            }
        }
    } catch (error) {
        console.error('Error fetching articles:', error);
    } finally {
        articlesLoading.value = false;
    }
}

// 各読み込み
Promise.all([
    fetchTags(),
    fetchArticles(),
]).catch(error => {
    console.error('Error fetching data:', error);
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
        { name: 'description', content: pageDescription },
    ],
});

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
                    class="text-hey mb-4 max-w-2xl text-2xl leading-none font-extrabold md:text-3xl xl:text-4xl text-primary">
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

                <Tags :tags="tags? tags : []" :loading="tagsLoading" />
                <Articles v-if="articles" limit="5" :articles :loading="articlesLoading" transition />
                <!--ロード完了までは記事なしを確定しない-->
                <div v-else-if="!articlesLoading" class="flex flex-col items-center justify-center gap-4">
                    <p class="text-lg font-bold text-accent">記事が見つかりませんでした。</p>
                    <p class="text-sm text-slate-500">初めての投稿をお待ちください。</p>
                </div>
            </div>
        </section>
    </main>
</template>
