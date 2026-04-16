<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    /** ハッシュタグページの URL（例: https://misskey.example/tags/vue） */
    url: string;
}>();

/** embed.js が識別に使うユニーク ID */
const embedId = `v1_${Math.random().toString(36).slice(2)}_${Date.now()}`;

const urlObj = computed(() => new URL(props.url));

const embedUrl = computed(() => {
    const tag = urlObj.value.pathname.split('/').pop() ?? '';
    return `https://${urlObj.value.hostname}/embed/tags/${tag}?header=true&autoload=false&maxHeight=700&border=true&rounded=true`;
});

const scriptUrl = computed(() => `https://${urlObj.value.hostname}/embed.js`);

const iframeStyle = 'border: none; width: 100%; max-width: 500px; height: 300px; color-scheme: light dark;';
</script>

<template>
    <iframe
        :src="embedUrl"
        :style="iframeStyle"
        :data-misskey-embed-id="embedId"
        loading="eager"
        class="w-full"
    />
    <component :is="'script'" :src="scriptUrl" defer />
</template>
