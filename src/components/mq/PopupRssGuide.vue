<script setup lang="ts">
defineProps({
    type: {
        type: String as () => "button" | "header" | "footer",
        default: "button",
        validator: (value: string) => ["button", "header", "footer"].includes(value)
    },
});

const config = useWebConfig();
const rss = config.value.rss;

const isOpen = ref(false);

const isVisibleRssFeedCopyTooltip = ref<boolean>(false)
const rssFeedCopy = () => {
    // RSSフィードのURLをクリップボードにコピー
    navigator.clipboard.writeText(config.value.rss.url).then(() => {
        //alert('RSSフィードのURLをコピーしました');
    }).catch((err) => {
        //console.error('coppy error', err);
    });
    isVisibleRssFeedCopyTooltip.value = true;
};

whenever(
    () => isVisibleRssFeedCopyTooltip.value,
    () =>
        useTimeoutFn(() => {
            isVisibleRssFeedCopyTooltip.value = false;
        }, 3000),
);
</script>

<template>
    <div>
        <!-- トリガー -->
        <button v-if="type === 'button'" @click="isOpen = true" title="RSSで購読する" aria-label="RSSで購読する"
            class="flex items-center gap-2 rounded-full border-pink-200 bg-pink-50 px-4 py-2 text-primary hover:bg-pink-100">
            <Icon :name="rss.icon" class="size-4" />
            RSSで購読
        </button>

        <button v-if="type === 'header'" title="RSSで購読する" aria-label="RSSで購読する"
            class="relative flex size-8 items-center justify-center rounded before:absolute before:-z-10 before:size-full before:rounded before:bg-slate-200/50 before:opacity-0 before:transition-opacity hover:before:opacity-100"
            @click="isOpen = true">
            <Icon :name="config.rss.icon" class="size-5" />
        </button>

        <button v-if="type === 'footer'" title="RSSで購読する" aria-label="RSSで購読する"
            class="relative flex size-8 items-center justify-center rounded before:absolute before:size-full before:rounded before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-20 hover:text-primary"
            @click="isOpen = true">
            <Icon :name="rss.icon" class="size-5" />
        </button>

        <teleport to="body">
            <transition name="fade">
                <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div class="fixed inset-0 bg-black bg-opacity-50" @click="isOpen = false"></div>

                    <div
                        class="relative max-w-md rounded-xl border-pink-200 bg-gradient-to-br from-rose-50 to-sky-50 p-6 shadow-lg">
                        <div class="text-center">
                            <div
                                class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary bg-opacity-20">
                                <Icon :name="rss.icon" class="size-6 bg-primary" />
                            </div>
                            <h2 class="text-xl font-bold text-primary">RSSって？</h2>
                            <p class="mt-2 text-gray-500">ブログの更新をカンタンにチェックする方法です</p>
                        </div>

                        <div class="my-6 space-y-4 text-sm">
                            <div class="flex items-start gap-3 rounded-lg bg-white bg-opacity-60 p-3">
                                <Icon name="akar-icons:bell" class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                                <div>
                                    <p class="font-medium text-primary">更新をお知らせ</p>
                                    <p class="text-gray-500">
                                        新しい記事が公開されたら自動的にお知らせします。いちいちサイトをチェックする必要はありません。
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start gap-3 rounded-lg bg-white bg-opacity-60 p-3">
                                <Icon name="iconamoon:clock" class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                                <div>
                                    <p class="font-medium text-primary">時間を節約</p>
                                    <p class="text-gray-500">
                                        RSSリーダーで複数のブログやニュースをまとめて読めるので、効率的に情報収集できます。
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-start gap-3 rounded-lg bg-white bg-opacity-60 p-3">
                                <Icon name="stash:smartphone" class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                                <div>
                                    <p class="font-medium text-primary">どこでも読める</p>
                                    <p class="text-gray-500">
                                        スマホやパソコンのRSSリーダーアプリで、いつでもどこでも最新情報をチェックできます。
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col sm:flex-row sm:justify-center sm:space-x-2">
                            <button @click="rssFeedCopy()"
                                class="relative flex items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 px-4 py-2">
                                <Icon :name="rss.icon" class="size-4 mr-2" />
                                RSSで購読する
                                <span :class="[
                                    isVisibleRssFeedCopyTooltip ? 'opacity-100' : 'opacity-0',
                                ]"
                                    class="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap rounded bg-black/70 px-2 py-1 text-xs text-white transition-opacity">
                                    URLをコピーしました
                                </span>
                            </button>
                            <button @click="isOpen = false"
                                class="mt-2 rounded-md border border-primary px-4 py-2 text-primary hover:bg-primary/20 sm:mt-0">
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            </transition>
        </teleport>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>