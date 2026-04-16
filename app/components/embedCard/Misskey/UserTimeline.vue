<script setup lang="ts">
const props = defineProps<{
    /** ユーザーページの URL（例: https://misskey.example/@username） */
    url: string;
}>();

/** embed.js が識別に使うユニーク ID */
const embedId = `v1_${Math.random().toString(36).slice(2)}_${Date.now()}`;

// ユーザー名から userId を解決した結果を保持
const resolvedInfo = ref<{ domain: string; userId: string }>({ domain: '', userId: '' });

watchEffect(async () => {
    if (!URL.canParse(props.url)) return;

    const urlObj = new URL(props.url);
    // パスの末尾 "@username" から "@" を除去してユーザー名を取得
    const username = (urlObj.pathname.split('/').pop() ?? '@').slice(1);

    try {
        const res = await fetch(`https://${urlObj.hostname}/api/users/show`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });
        const userInfo = await res.json();
        if (userInfo?.id != null) {
            resolvedInfo.value = { domain: urlObj.hostname, userId: userInfo.id };
        }
    } catch {
        resolvedInfo.value = { domain: '', userId: '' };
    }
});

const embedUrl = computed(() => {
    const { domain, userId } = resolvedInfo.value;
    if (!domain || !userId) return '';
    return `https://${domain}/embed/user-timeline/${userId}?header=true&autoload=false&maxHeight=700&border=true&rounded=true`;
});

const scriptUrl = computed(() => {
    const { domain } = resolvedInfo.value;
    return domain ? `https://${domain}/embed.js` : '';
});

const iframeStyle = 'border: none; width: 100%; max-width: 500px; height: 300px; color-scheme: light dark;';
</script>

<template>
    <iframe
        v-if="embedUrl"
        :src="embedUrl"
        :style="iframeStyle"
        :data-misskey-embed-id="embedId"
        loading="eager"
        class="w-full"
    />
    <component :is="'script'" v-if="scriptUrl" :src="scriptUrl" defer />
</template>
