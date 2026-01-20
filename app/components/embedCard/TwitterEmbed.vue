<script setup lang="ts">
const props = defineProps<{
    preview: LinkPreviewResponse;
}>();

onMounted(() => {
    const w = window as any;
    if (!w.twttr) {
        const script = document.createElement('script');
        script.setAttribute('src', 'https://platform.twitter.com/widgets.js');
        script.setAttribute('async', 'true');
        script.setAttribute('charset', 'utf-8');
        document.head.appendChild(script);
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
