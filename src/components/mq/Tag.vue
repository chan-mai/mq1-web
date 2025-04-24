<script setup lang="ts">

// デフォルト値を指定
const props = withDefaults(defineProps<{
    tag?: Tag;
}>(), {
    tag: () => ({
        id: 'uncategorized',
        name: '未分類',
    }),
});
</script>
<template>
    <a v-if="tag" :href="`/tag/${tag.id}`" class="inline-flex items-center px-3 py-1.5 rounded-full text-sm 
            bg-white border border-primary text-gray-700 hover:bg-primary hover:text-white
            transition-colors duration-200 shadow-sm">
        <Icon v-if="!tag.count" name="material-symbols:tag-rounded" class="mr-0.5 size-5 text-primary" />
        <span class="mr-1.5">{{ tag.name }}</span>
        <span v-if="tag.count" class="text-xs bg-primary text-white rounded-full px-1.5 py-0.5">{{ tag.count }}</span>
    </a>
</template>
