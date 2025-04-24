<script setup lang="ts">
const route = useRoute();
const { tagId } = route.params as { tagId: string };

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

const articles = computed(() => articlesData.value || []);
const tagName = computed(() => {
    if (!articlesData.value) return '未分類';

    // すべての記事から探索
    for (const article of articlesData.value as any[]) {
        // 各記事のtagsの中からidが一致するタグを探す
        const foundTag = article.tags.find((tag: { id: string; }) => tag.id === tagId);
        if (foundTag) {
            return foundTag.name;
        }
    }

    return '未分類';
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
                    <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">
                        #{{ tagName }}
                    </span>
                    の記事一覧
                </h2>
            </div>
            <div class="flex flex-col gap-8">
                <Articles :articles />
            </div>
        </section>
    </main>
</template>
