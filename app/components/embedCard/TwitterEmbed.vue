<script setup lang="ts">
const props = defineProps<{
    preview: LinkPreviewResponse;
}>();

const SCRIPT_ID = 'twitter-widgets';

onMounted(() => {
    const w = window as any;
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!w.twttr) {
        if (!existing) {
            const script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            script.onload = () => w.twttr?.widgets?.load();
            document.head.appendChild(script);
        } else {
            existing.addEventListener('load', () => w.twttr?.widgets?.load(), { once: true });
        }
    } else {
        w.twttr.widgets.load();
    }
});
</script>

<template>
    <div class="w-full flex justify-start">
        <blockquote class="twitter-tweet" data-dnt="true" data-theme="light">
            <a :href="preview.url"></a>
        </blockquote>
    </div>
</template>
