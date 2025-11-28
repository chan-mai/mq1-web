<script setup lang="ts">
const props = defineProps({
    title: {
        type: String,
        required: false,
    },
    url: {
        type: String,
        required: false,
    },
});
const ogUrl = computed(() => {
    if ( !props.url || typeof props.url !== 'string' || props.url.length === 0 ) {
        return useOgGenerator(props.title!);
    } else {
        return props.url;
    }
});

</script>
<template>
    <NuxtImg :src="ogUrl" :alt="title" format="webp" width="1200" height="630" class="w-full h-full object-contain object-center" loading="lazy" decoding="async"/>
</template>