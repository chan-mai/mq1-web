<script setup lang="ts">
defineProps({
    type: {
        type: String as () => "button" | "header" | "footer",
        default: "button",
        validator: (value: string) => ["button", "header", "footer"].includes(value)
    },
});

const config = useWebConfig();
const { proxy } = useScriptGoogleAnalytics();
const rss = config.value.rss;

const isOpen = ref(false);

const rssFeedCopy = () => {
    // RSSフィードのURLをクリップボードにコピー
    navigator.clipboard.writeText(config.value.rss.url).then(() => {
        proxy.gtag('event', 'feed_subscribed');
        useToast().success({
            title: 'RSSフィードのURLをコピーしました！',
        });
    }).catch(() => {
        useToast().error({
            title: 'コピーに失敗しました',
        });
    });
};

const close = () => { isOpen.value = false; };

const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen.value) close();
};

onMounted(() => document.addEventListener('keydown', onKeyDown));
onUnmounted(() => document.removeEventListener('keydown', onKeyDown));
</script>

<template>
    <div>
        <!-- トリガー -->
        <button v-if="type === 'button'" @click="isOpen = true" title="RSSで購読する" aria-label="RSSで購読する"
            class="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-elevated px-3 py-1.5 text-sm text-fg transition-colors hover:border-primary hover:text-primary">
            <Icon :name="rss.icon" class="size-4" />
            RSSで購読
        </button>

        <button v-if="type === 'header'" title="RSSで購読する" aria-label="RSSで購読する"
            class="relative flex size-8 border-none items-center justify-center rounded before:absolute before:-z-10 before:size-full before:rounded before:bg-slate-200/50 before:opacity-0 before:transition-opacity hover:before:opacity-100"
            @click="isOpen = true">
            <Icon :name="config.rss.icon" class="size-5" />
        </button>

        <button v-if="type === 'footer'" title="RSSで購読する" aria-label="RSSで購読する"
            class="relative flex size-8 border-none items-center justify-center rounded before:absolute before:size-full before:rounded before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-20 hover:text-primary"
            @click="isOpen = true">
            <Icon :name="rss.icon" class="size-5" />
        </button>

        <teleport to="body">
            <!-- バックドロップ -->
            <transition name="fade">
                <div v-if="isOpen" class="fixed inset-0 z-50 bg-gray-500/25 backdrop-blur-sm" @click="close" />
            </transition>

            <!-- モーダル -->
            <transition name="modal">
                <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="rss-popup-title"
                        class="pointer-events-auto relative w-full max-w-sm rounded-xl bg-surface-elevated shadow-2xl ring-1 ring-black/5">

                        <!-- ヘッダー -->
                        <div class="px-8 pt-8 pb-6">
                            <p class="mb-3 text-[11px] tracking-[0.2em] uppercase text-primary">RSS</p>
                            <h2 id="rss-popup-title" class="text-2xl font-semibold text-fg">RSSって？</h2>
                            <p class="mt-2 text-sm leading-relaxed text-fg-muted">ブログの更新をカンタンにチェックする方法です</p>
                        </div>

                        <!-- メリット一覧 -->
                        <div class="border-t border-border-subtle px-8">
                            <ul class="divide-y divide-border-subtle">
                                <li class="flex items-start gap-4 py-4">
                                    <Icon name="akar-icons:bell" class="mt-0.5 size-5 shrink-0 text-primary" />
                                    <div>
                                        <p class="text-sm font-medium text-fg">更新をお知らせ</p>
                                        <p class="mt-1 text-sm leading-relaxed text-fg-muted">新しい記事が公開されたら自動的にお知らせします。いちいちサイトをチェックする必要はありません。</p>
                                    </div>
                                </li>
                                <li class="flex items-start gap-4 py-4">
                                    <Icon name="iconamoon:clock" class="mt-0.5 size-5 shrink-0 text-primary" />
                                    <div>
                                        <p class="text-sm font-medium text-fg">時間を節約</p>
                                        <p class="mt-1 text-sm leading-relaxed text-fg-muted">RSSリーダーで複数のブログやニュースをまとめて読めるので、効率的に情報収集できます。</p>
                                    </div>
                                </li>
                                <li class="flex items-start gap-4 py-4">
                                    <Icon name="stash:smartphone" class="mt-0.5 size-5 shrink-0 text-primary" />
                                    <div>
                                        <p class="text-sm font-medium text-fg">どこでも読める</p>
                                        <p class="mt-1 text-sm leading-relaxed text-fg-muted">スマホやパソコンのRSSリーダーアプリで、いつでもどこでも最新情報をチェックできます。</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <!-- アクション -->
                        <div class="flex items-center justify-end gap-2 border-t border-border-subtle px-8 py-5">
                            <button @click="close"
                                class="border-none bg-transparent px-3 py-2 text-sm text-fg-muted transition-colors hover:text-fg">
                                閉じる
                            </button>
                            <button @click="rssFeedCopy()"
                                class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90 border-none">
                                <Icon :name="rss.icon" class="size-4" />
                                RSSで購読する
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
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
    transform: scale(0.98);
}
</style>
