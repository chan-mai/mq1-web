<script setup lang="ts">
const props = defineProps({
    title: {
        type: String,
        required: false,
    },
    contentId: {
        type: String,
        required: false,
    },
    tagId: {
        type: String,
        required: false,
    },
    url: {
        type: String,
        required: false,
    },
});
const config = useWebConfig();

const ogUrl = computed(() => {
    if ( !props.url || typeof props.url !== 'string' || props.url.length === 0 ) {
        if ( props.contentId ) {
            return useArticleOgGenerator(props.contentId);
        } else if ( props.tagId ) {
            return useTagOgGenerator(props.tagId);
        } else {
            return "/images/ogp/ogp.png";
        }
    } else {
        return props.url;
    }
});

</script>
<template>
    <NuxtImg :src="ogUrl" :alt="title" format="webp" width="1200" height="630" class="w-full h-full object-contain object-center" loading="lazy" decoding="async"/>
</template>