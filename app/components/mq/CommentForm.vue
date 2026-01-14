<script setup lang="ts">
import Avatar from 'vue-boring-avatars';

const props = defineProps<{
    isLoading: boolean;
    replyToName?: string | null;
    initialComment?: string;
}>();

const emit = defineEmits<{
    (e: 'submit', payload: { name: string; comment: string; token: string }): void;
    (e: 'cancel'): void;
}>();

const name = ref('');
const content = ref(props.initialComment || '');
const turnstile = ref();

// バリデーション
const isNameValid = computed(() => name.value.trim().length > 0 && name.value.trim().length <= 50);
const isContentValid = computed(() => content.value.trim().length > 0 && content.value.trim().length <= 1000);
const isFormValid = computed(() => isNameValid.value && isContentValid.value);

const handleSubmit = () => {
    if (!isFormValid.value || props.isLoading) return;
    emit('submit', {
        name: name.value.trim(),
        comment: content.value.trim(),
        token: turnstile.value,
    });
};

const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
    }
};

const clear = () => {
    name.value = '';
    content.value = '';
    if (turnstile.value) {
        turnstile.value.reset();
    }
};

defineExpose({ clear, name, comment: content });
</script>

<template>
    <div class="flex gap-4 p-4 md:p-8 rounded-xl bg-white">
        <div class="shrink-0">
            <div class="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
                <client-only>
                    <Avatar :size="36" :name="name" variant="beam"
                        :colors="['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']" />
                </client-only>
            </div>
        </div>

        <div class="flex-1 min-w-0 flex flex-col gap-3">
            <div class="flex flex-col gap-3">
                <div>
                    <label for="name" class="text-sm font-medium text-gray-700">お名前</label>
                    <input v-model="name" type="text" placeholder="お名前 (必須)" maxlength="50"
                        class="w-full text-sm font-medium bg-white border border-gray-200 rounded-md p-2 focus:ring-0 placeholder:text-gray-400"
                        :disabled="isLoading" />
                </div>

                <div>
                    <label for="comment" class="text-sm font-medium text-gray-700">コメント</label>
                    <textarea id="comment" v-model="content"
                        :placeholder="replyToName ? `${replyToName}さんへ返信...` : 'この記事についてコメントを書く...'" rows="1"
                        class="w-full resize-none bg-white border border-gray-200 rounded-md p-2 text-sm leading-relaxed placeholder:text-gray-400 focus:ring-0 min-h-[80px]"
                        @keydown="handleKeyDown" :disabled="isLoading" style="field-sizing: content;"></textarea>
                </div>
            </div>

            <div class="flex flex-col gap-3 pt-2">
                <div class="overflow-hidden">
                    <NuxtTurnstile ref="turnstile" />
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-400 hidden sm:inline-block">⌘ + Enter で送信</span>

                    <div class="flex items-center gap-2 ml-auto">
                        <button v-if="replyToName" @click="$emit('cancel')" type="button"
                            class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors border-none">
                            キャンセル
                        </button>

                        <button @click="handleSubmit" :disabled="!isFormValid || isLoading"
                            class="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 border"
                            :class="[
                                isFormValid && !isLoading
                                    ? 'bg-primary text-white border-primary hover:bg-primary/90 shadow-sm'
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            ]">
                            <Icon v-if="isLoading" name="mdi:loading" class="h-3 w-3 animate-spin" />
                            <Icon v-else name="lucide:send" class="h-3 w-3" />
                            送信
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 入力のデフォルトアウトラインを削除 */
input:focus,
textarea:focus {
    outline: none;
}
</style>
