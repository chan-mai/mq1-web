<script setup lang="ts">

// デフォルト値を指定
const props = withDefaults(defineProps<{
    tag?: Tag;
    transition?: boolean;
}>(), {
    tag: () => ({
        id: 'uncategorized',
        name: '未分類',
    }),
    transition: () => false,
});
</script>
<template>
    <NuxtLink v-if="tag" :to="`/tag/${tag.id}`" class="group inline-flex items-center px-3 py-1.5 rounded-full text-sm 
            bg-white border border-primary text-gray-700 hover:bg-primary hover:text-white
            transition-colors duration-200 shadow-sm" :style="transition ? `view-transition-name: tag-${tag.id};` : ''">
        <Icon v-if="!tag.count" name="material-symbols:tag-rounded" class="mr-0.5 size-5 text-primary group-hover:text-white" />
        <span class="mr-1.5">{{ tag.name }}</span>
        <span v-if="tag.count" class="text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ tag.count }}</span>
    </NuxtLink>
</template>
