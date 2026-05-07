<script setup lang="ts">
import type { MicroCMSObject } from '#shared/types/microccms';

// デフォルト値を指定
const props = withDefaults(defineProps<{
    tag?: MicroCMSObject<Tag>;
    transition?: boolean;
    variant?: 'default' | 'compact';
}>(), {
    tag: () => ({
        id: 'uncategorized',
        name: '未分類',
    }),
    transition: () => false,
    variant: () => 'default',
});
</script>
<template>
    <NuxtLink
        v-if="tag"
        :to="`/tag/${tag.slug}`"
        class="group/tag inline-flex items-center transition-colors duration-200"
        :class="[
            variant === 'default' ? 'px-3 py-1 rounded-full text-sm bg-surface-elevated border border-primary text-fg hover:bg-primary hover:text-white shadow-sm' : '',
            variant === 'compact' ? 'text-[10px] px-1.5 py-0.5 text-primary/80 hover:text-accent' : ''
        ]"
        :style="transition ? `view-transition-name: tag-${tag.slug};` : ''"
    >
        <Icon
            v-if="!tag.count"
            name="material-symbols:tag-rounded"
            :class="[
                variant === 'default' ? 'mr-0.5 size-5 text-primary group-hover/tag:text-white transition-colors duration-200' : '',
                variant === 'compact' ? 'size-3 text-primary/80 group-hover/tag:text-accent transition-colors duration-200' : ''
            ]"
        />
        <span :class="variant === 'default' ? 'mr-1.5' : ''">{{ tag.name }}</span>
        <span v-if="tag.count" class="text-xs bg-primary text-white rounded-full px-1.5 py-0.5 ml-1.5">{{ tag.count }}</span>
    </NuxtLink>
</template>
