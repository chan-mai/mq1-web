<script setup lang="ts">
defineProps<{
    preview: LinkPreviewResponse;
}>();
</script>

<template>
    <div class="w-full aspect-video rounded-2xl overflow-hidden border-2 border-secondary/20 bg-black">
        <iframe
            v-if="preview.embedId"
            :src="`https://www.youtube.com/embed/${preview.embedId}`"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
        ></iframe>
    </div>
</template>
