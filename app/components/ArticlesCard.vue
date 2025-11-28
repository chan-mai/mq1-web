<script setup lang="ts">
import type { MicroCMSObject } from '#shared/types/microccms';

const props = defineProps({
    article: {
        type: Object as () => MicroCMSObject<Article>,
        required: true,
    },
    transition: {
        type: Boolean,
        default: false
    }
});

// サマリーを生成
const summary = computed(() => {
    const fullSummary = useSummaryTextGenerator(props.article.content!);
    // カード用に80文字に制限
    return fullSummary.length > 50  
        ? fullSummary.slice(0, 50) + '...' 
        : fullSummary;
});

// タグをクリックした時の処理
const router = useRouter();
function navigateToTag(tag: any) {
    router.push(`/tag/${tag.id}`);
}
</script>

<template>
    <div class="article-card group h-full">
        <NuxtLink :to="`/entry/${article.id}`" class="block h-full flex flex-col">
            <!-- 画像エリア -->
            <div class="image-wrapper">
                <MqOgImage 
                    :content-id="article.id"
                    :url="article.eyecatch?.url"
                    :title="article.title" 
                    fill
                    class="article-image"
                    :style="`view-transition-name: article-${article.id};`" 
                />
            </div>

            <!-- コンテンツエリア -->
            <div class="card-content">
                <!-- 日付バッジ -->
                <div class="date-badge">
                    <Icon name="mdi:calendar-outline" class="w-3.5 h-3.5" />
                    <span>
                        {{ new Date(article.publishedAt! ?? article.createdAt!).toLocaleString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            timeZone: 'Asia/Tokyo',
                        }) }}
                    </span>
                </div>

                <!-- タイトル -->
                <h3 
                    class="article-title"
                    :style="`view-transition-name: article-title-${article.id};`"
                >
                    {{ article.title }}
                </h3>

                <!-- サマリー -->
                <p class="article-summary">
                    {{ summary }}
                </p>

                <!-- タグ -->
                <div v-if="article.tags && article.tags.length > 0" class="tags-wrapper">
                    <MqTag 
                        v-for="tag in article.tags.slice(0, 3)" 
                        :key="tag.id"
                        :tag="tag" 
                        @click.stop.prevent="navigateToTag(tag)"
                        :transition 
                        class="text-xs px-2.5 py-1 flex-shrink-0 tag-fixed card-tag"
                    />
                </div>

                <!-- 続きを読むリンク -->
                <div class="read-more">
                    <span class="read-more-text">
                        続きを読む
                        <Icon 
                            name="mdi:arrow-right-circle"
                            class="read-more-icon" 
                        />
                    </span>
                </div>
            </div>
        </NuxtLink>
    </div>
</template>

<style scoped>
/* カード全体 */
.article-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.article-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 画像エリア */
.image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 2/1;
    overflow: hidden;
    background: linear-gradient(135deg, #ffeef0 0%, #fff5f7 100%);
}

.article-image {
    object-fit: cover;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.group:hover .article-image {
    transform: scale(1.05);
}

/* コンテンツエリア */
.card-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;
}

/* 日付バッジ */
.date-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: #fff0f3;
    color: theme('colors.primary');
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 500;
    width: fit-content;
    margin-bottom: 1rem;
}

/* タイトル */
.article-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.75rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;
}

.group:hover .article-title {
    color: theme('colors.primary');
}

/* サマリー */
.article-summary {
    color: #666;
    font-size: 0.875rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* タグエリア */
.tags-wrapper {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.card-tag {
    border-radius: 100px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.card-tag :deep(.tag-icon) {
    color: theme('colors.primary') !important;
}

.card-tag:hover :deep(.tag-icon) {
    color: white !important;
}

/* 続きを読むリンク */
.read-more {
    margin-top: auto;
    padding-top: 0.5rem;
}

.read-more-text {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: theme('colors.primary');
    font-size: 0.875rem;
    font-weight: 600;
    transition: gap 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.group:hover .read-more-text {
    gap: 0.625rem;
}

.read-more-icon {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.group:hover .read-more-icon {
    transform: translateX(2px);
}
</style>
