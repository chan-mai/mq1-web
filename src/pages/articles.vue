<script setup lang="ts">
const { data: articlesData } = await useAsyncData('articles', async () => {
    const { data } = await useMicroCMSGetList<Article[]>({
        endpoint: 'articles',
        queries: {
            limit: 5,
            orders: '-publishedAt',
        },
    });
    return data.value?.contents;
});

const articles = computed(() => articlesData.value || []);
</script>
<template>
    <main
        class="max-w-none h-full text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0 max-w-7xl gap-16 md:gap-20 space-y-16">
        <MqHero />

        <!-- 直近記事 -->
        <section class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-2 md:px-6">
            <div class="flex items-center justify-between">
                <h2 class="font-accent text-3xl font-bold text-slate-800 md:text-4xl">
                    記事一覧
                </h2>
            </div>
            <div class="flex flex-col gap-8">
                <Articles :articles />
            </div>
        </section>
    </main>
</template>
