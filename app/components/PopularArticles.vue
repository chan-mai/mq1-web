<script setup lang="ts">
const props = defineProps<{
    excludeId?: string;
}>();

// payloadへの焼き込み回避のためクライアント側でのみ取得
const { data } = useLazyFetch('/api/popular-articles', {
    query: { excludeId: props.excludeId },
    server: false,
});

const articles = computed(() => data.value?.status === 'success' ? data.value.articles : []);
</script>

<template>
    <div v-if="articles && articles.length > 0" class="px-5 py-8">
        <div class="flex items-center gap-2 mb-6">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Icon name="lucide:flame" class="h-4 w-4 text-white" />
            </div>
            <h3 class="text-lg text-primary">人気記事</h3>
        </div>

        <div class="flex flex-col space-y-6">
            <NuxtLink v-for="article in articles" :key="article.id" :to="`/entry/${article.id}`" class="group block">
                <div class="flex justify-between items-start gap-4">
                    <div class="flex-1 min-w-0 py-1">
                        <h4
                            class="text-fg group-hover:text-primary font-bold text-base leading-snug mb-2 transition-colors duration-300">
                            {{ article.title }}
                        </h4>

                        <div class="flex items-center text-sm text-fg-muted">
                            <!-- Using a static heart icon to match the visual style requested, even if count isn't real/dynamic yet -->
                            <Icon name="ph:heart-fill" class="w-4 h-4 text-primary/60 mr-1" />
                            <span>{{ article.likeCount }}</span>
                        </div>
                    </div>

                    <div
                        class="shrink-0 w-28 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden bg-surface-muted border border-border-subtle">
                        <MqOgImage :url="article.eyecatch?.url" :content-id="article.id" :title="article.title"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                </div>
            </NuxtLink>
        </div>
    </div>
</template>
