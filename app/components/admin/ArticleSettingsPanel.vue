<script setup lang="ts">
const props = defineProps<{
  articleId: string;
  status: ArticleStatus;
}>();

const emit = defineEmits<{
  unpublish: [];
  delete: [];
  close: [];
}>();

const tagIds = defineModel<string[]>('tagIds', { required: true });
const eyecatch = defineModel<{
  key: string;
  url: string | null;
  width: number | null;
  height: number | null;
} | null>('eyecatch', { required: true });
const isNoIndex = defineModel<boolean>('isNoIndex', { required: true });
const publishedAt = defineModel<string | null>('publishedAt', {
  required: true,
});

const toast = useToast();
const { data: tagData, refresh: refreshTags } = useFetch('/api/admin/tags');

const toggleTag = (id: string) => {
  tagIds.value = tagIds.value.includes(id)
    ? tagIds.value.filter((tagId) => tagId !== id)
    : [...tagIds.value, id];
};

const newTagName = ref('');
const newTagSlug = ref('');
const createTag = async () => {
  try {
    const tag = await $fetch('/api/admin/tags', {
      method: 'POST',
      body: { name: newTagName.value, slug: newTagSlug.value },
    });
    newTagName.value = '';
    newTagSlug.value = '';
    await refreshTags();
    tagIds.value = [...tagIds.value, tag.id];
  } catch {
    toast.error({ title: 'タグの作成に失敗しました' });
  }
};

// アイキャッチ
const eyecatchInput = useTemplateRef<HTMLInputElement>('eyecatchInput');
const uploadingEyecatch = ref(false);
const draggingEyecatch = ref(false);

const onEyecatchSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) uploadEyecatch(file);
};

const onEyecatchDrop = (event: DragEvent) => {
  draggingEyecatch.value = false;
  const file = Array.from(event.dataTransfer?.files ?? []).find((item) =>
    item.type.startsWith('image/'),
  );
  if (file) uploadEyecatch(file);
};

const { upload: uploadImage } = useImageUpload();

const uploadEyecatch = async (file: File) => {
  uploadingEyecatch.value = true;
  try {
    const uploaded = await uploadImage(file);
    eyecatch.value = {
      key: uploaded.key,
      url: uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
    };
  } catch {
    toast.error({ title: '画像のアップロードに失敗しました' });
  } finally {
    uploadingEyecatch.value = false;
  }
};

// publishedAtはdatetime-local(ローカル時刻)とISOを相互変換
const publishedAtLocal = computed({
  get: () => {
    if (!publishedAt.value) return '';
    const date = new Date(publishedAt.value);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },
  set: (value: string) => {
    if (!value) return;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      publishedAt.value = date.toISOString();
    }
  },
});

const deleteDialogOpen = ref(false);

const copyArticleId = async () => {
  await navigator.clipboard.writeText(props.articleId);
  toast.success({ title: '記事IDをコピーしました' });
};
</script>

<template>
  <aside
    class="flex h-full w-full flex-col gap-8 overflow-y-auto border-l border-border-subtle bg-surface p-6"
  >
    <div class="flex items-center justify-between lg:hidden">
      <h2 class="text-sm font-bold">記事の設定</h2>
      <AdminUiButton
        variant="icon"
        class="!size-8"
        title="閉じる"
        @click="emit('close')"
      >
        <Icon name="lucide:x" class="size-4" />
      </AdminUiButton>
    </div>
    <section
      @dragover.prevent="draggingEyecatch = true"
      @dragleave.prevent="draggingEyecatch = false"
      @drop.prevent="onEyecatchDrop"
    >
      <h3 class="mb-2 text-sm font-bold">アイキャッチ</h3>
      <div v-if="eyecatch?.url" class="space-y-2">
        <img
          :src="eyecatch.url"
          alt=""
          class="w-full rounded-md border border-solid transition-colors"
          :class="draggingEyecatch ? 'border-primary' : 'border-border-subtle'"
        />
        <div class="flex gap-3 text-xs">
          <button
            type="button"
            class="cursor-pointer border-none bg-transparent p-0 text-xs text-fg-muted transition-colors hover:text-fg"
            @click="eyecatchInput?.click()"
          >
            変更
          </button>
          <button
            type="button"
            class="cursor-pointer border-none bg-transparent p-0 text-xs text-fg-muted transition-colors hover:text-red-500"
            @click="eyecatch = null"
          >
            削除
          </button>
        </div>
      </div>
      <button
        v-else
        type="button"
        class="flex h-24 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-transparent text-xs transition-colors disabled:cursor-default"
        :class="
          draggingEyecatch
            ? 'border-primary bg-surface-muted text-fg'
            : 'border-border-subtle text-fg-muted hover:bg-surface-muted'
        "
        :disabled="uploadingEyecatch"
        @click="eyecatchInput?.click()"
      >
        {{ uploadingEyecatch ? 'アップロード中…' : '画像を選択' }}
      </button>
      <input
        ref="eyecatchInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        class="hidden"
        @change="onEyecatchSelected"
      />
    </section>

    <section>
      <h3 class="mb-3 text-sm font-bold">タグ</h3>
      <ul class="mb-4 space-y-2">
        <li v-for="tag in tagData?.tags ?? []" :key="tag.id">
          <AdminUiCheckbox
            :model-value="tagIds.includes(tag.id)"
            @update:model-value="toggleTag(tag.id)"
          >
            <span class="text-sm">{{ tag.name }}</span>
          </AdminUiCheckbox>
        </li>
      </ul>
      <form class="flex items-center gap-1.5" @submit.prevent="createTag">
        <input
          v-model="newTagName"
          placeholder="タグ名"
          class="h-8 w-0 flex-1 rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none transition-colors focus:border-fg"
        />
        <input
          v-model="newTagSlug"
          placeholder="slug"
          class="h-8 w-0 flex-1 rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none transition-colors focus:border-fg"
        />
        <button
          type="submit"
          class="h-8 shrink-0 cursor-pointer rounded-md border-none bg-fg px-3 text-xs font-bold text-surface transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-50"
          :disabled="!newTagName.trim() || !newTagSlug.trim()"
        >
          追加
        </button>
      </form>
    </section>

    <section class="space-y-4">
      <h3 class="text-sm font-bold">詳細設定</h3>
      <AdminUiCheckbox v-model="isNoIndex">
        <span class="text-sm">検索エンジンに登録しない</span>
      </AdminUiCheckbox>
      <div v-if="publishedAt" class="text-sm">
        <p class="mb-1 text-xs text-fg-muted">公開日時</p>
        <input
          v-model="publishedAtLocal"
          type="datetime-local"
          class="h-8 rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none transition-colors focus:border-fg"
        />
      </div>
      <div class="text-sm">
        <p class="mb-1 text-xs text-fg-muted">記事ID</p>
        <button
          type="button"
          class="cursor-pointer border-none bg-transparent p-0 font-mono text-xs text-fg-muted transition-colors hover:text-fg"
          title="コピー"
          @click="copyArticleId"
        >
          {{ articleId }}
        </button>
      </div>
    </section>

    <section class="mt-auto space-y-3 border-t border-border-subtle pt-4">
      <button
        v-if="status === 'published'"
        type="button"
        class="block cursor-pointer border-none bg-transparent p-0 text-sm text-fg-muted transition-colors hover:text-fg"
        @click="emit('unpublish')"
      >
        下書きに戻す
      </button>
      <button
        type="button"
        class="block cursor-pointer border-none bg-transparent p-0 text-sm text-fg-muted transition-colors hover:text-red-500"
        @click="deleteDialogOpen = true"
      >
        記事を削除
      </button>
    </section>

    <AdminUiConfirmDialog
      v-model:open="deleteDialogOpen"
      title="記事を削除しますか？"
      description="この操作は取り消せません。"
      confirm-label="削除する"
      @confirm="emit('delete')"
    />
  </aside>
</template>
