<script setup lang="ts">
definePageMeta({ layout: "admin" });
useHead({ title: "サイト設定" });

const toast = useToast();

const { data: tagData, refresh: refreshTags } =
  await useFetch("/api/admin/tags");
const { data: articleData } = await useFetch("/api/admin/articles");
const { data: settings, refresh: refreshSettings } = await useFetch(
  "/api/admin/settings",
);

// タグ作成
const newTagName = ref("");
const newTagSlug = ref("");
const createTag = async () => {
  try {
    await $fetch("/api/admin/tags", {
      method: "POST",
      body: { name: newTagName.value, slug: newTagSlug.value },
    });
    newTagName.value = "";
    newTagSlug.value = "";
    await refreshTags();
    toast.success({ title: "タグを作成しました" });
  } catch {
    toast.error({ title: "タグの作成に失敗しました" });
  }
};

// タグ編集
const editingTagId = ref<string | null>(null);
const editTagName = ref("");
const editTagSlug = ref("");
const startEditTag = (tag: { id: string; name: string; slug: string }) => {
  editingTagId.value = tag.id;
  editTagName.value = tag.name;
  editTagSlug.value = tag.slug;
};
const cancelEditTag = () => {
  editingTagId.value = null;
};
const updateTag = async () => {
  if (!editingTagId.value) return;
  try {
    await $fetch(`/api/admin/tags/${editingTagId.value}`, {
      method: "PUT",
      body: { name: editTagName.value, slug: editTagSlug.value },
    });
    editingTagId.value = null;
    await refreshTags();
    toast.success({ title: "タグを更新しました" });
  } catch {
    toast.error({ title: "タグの更新に失敗しました" });
  }
};

// タグ削除
const deleteTagTarget = ref<{ id: string; name: string } | null>(null);
const deleteTagDialogOpen = ref(false);
const requestDeleteTag = (tag: { id: string; name: string }) => {
  deleteTagTarget.value = tag;
  deleteTagDialogOpen.value = true;
};
const deleteTag = async () => {
  if (!deleteTagTarget.value) return;
  try {
    await $fetch(`/api/admin/tags/${deleteTagTarget.value.id}`, {
      method: "DELETE",
    });
    await refreshTags();
    toast.success({ title: "タグを削除しました" });
  } catch {
    toast.error({ title: "タグの削除に失敗しました" });
  } finally {
    deleteTagTarget.value = null;
  }
};

// 固定記事
const publishedArticles = computed(() =>
  (articleData.value?.articles ?? []).filter(
    (article) => article.status === "published",
  ),
);
const pinnedIds = ref<string[]>([]);
watchEffect(() => {
  pinnedIds.value = settings.value?.pinnedArticleIds ?? [];
});
const pinnedDirty = computed(
  () =>
    JSON.stringify(pinnedIds.value) !==
    JSON.stringify(settings.value?.pinnedArticleIds ?? []),
);

const togglePinned = (id: string) => {
  pinnedIds.value = pinnedIds.value.includes(id)
    ? pinnedIds.value.filter((pinned) => pinned !== id)
    : [...pinnedIds.value, id];
};

const savingPinned = ref(false);
const savePinned = async () => {
  savingPinned.value = true;
  try {
    await $fetch("/api/admin/settings", {
      method: "PUT",
      body: { pinnedArticleIds: pinnedIds.value },
    });
    await refreshSettings();
    toast.success({ title: "固定記事を保存しました" });
  } catch {
    toast.error({ title: "固定記事の保存に失敗しました" });
  } finally {
    savingPinned.value = false;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-6 py-10">
    <header class="mb-10 flex items-center gap-3">
      <AdminUiButton to="/admin" variant="icon" title="一覧へ戻る">
        <Icon name="lucide:arrow-left" class="size-5" />
      </AdminUiButton>
      <h1 class="text-xl font-bold">サイト設定</h1>
    </header>

    <section class="mb-14">
      <h2 class="mb-4 font-bold">タグ</h2>
      <ul
        class="mb-4 divide-y divide-border-subtle overflow-hidden rounded-lg border border-solid border-border-subtle">
        <li v-for="tag in tagData?.tags ?? []" :key="tag.id"
          class="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
          <template v-if="editingTagId === tag.id">
            <form class="flex w-full items-center gap-1.5" @submit.prevent="updateTag">
              <input v-model="editTagName" placeholder="タグ名"
                class="h-8 w-0 flex-1 rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none transition-colors focus:border-fg" />
              <input v-model="editTagSlug" placeholder="slug"
                class="h-8 w-0 flex-1 rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none transition-colors focus:border-fg" />
              <button type="submit"
                class="h-8 shrink-0 cursor-pointer rounded-md border-none bg-fg px-3 text-xs font-bold text-surface transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-50"
                :disabled="!editTagName.trim() || !editTagSlug.trim()">
                保存
              </button>
              <button type="button"
                class="h-8 shrink-0 cursor-pointer rounded-md border-none bg-transparent px-2 text-xs text-fg-muted transition-colors hover:text-fg"
                @click="cancelEditTag">
                キャンセル
              </button>
            </form>
          </template>
          <template v-else>
            <div class="min-w-0">
              <span class="font-bold">{{ tag.name }}</span>
              <span class="ml-2 text-xs text-fg-muted">/{{ tag.slug }}</span>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <span class="mr-2 text-xs text-fg-muted">{{ tag.articleCount }}記事</span>
              <AdminUiButton variant="icon" class="!size-8" title="編集" @click="startEditTag(tag)">
                <Icon name="lucide:pencil" class="size-3.5" />
              </AdminUiButton>
              <button type="button"
                class="cursor-pointer border-none bg-transparent p-0 text-xs text-fg-muted transition-colors hover:text-red-500"
                @click="requestDeleteTag(tag)">
                削除
              </button>
            </div>
          </template>
        </li>
        <li v-if="(tagData?.tags ?? []).length === 0" class="px-4 py-6 text-center text-sm text-fg-muted">
          タグはありません
        </li>
      </ul>
      <form class="flex items-center gap-1.5" @submit.prevent="createTag">
        <input v-model="newTagName" placeholder="タグ名"
          class="h-8 w-40 rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none transition-colors focus:border-fg" />
        <input v-model="newTagSlug" placeholder="slug"
          class="h-8 w-40 rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none transition-colors focus:border-fg" />
        <button type="submit"
          class="h-8 shrink-0 cursor-pointer rounded-md border-none bg-fg px-3 text-xs font-bold text-surface transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-50"
          :disabled="!newTagName.trim() || !newTagSlug.trim()">
          追加
        </button>
      </form>
    </section>

    <section>
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="font-bold">固定記事</h2>
          <p class="mt-1 text-xs text-fg-muted">
            トップページの先頭に固定表示します(選択順)
          </p>
        </div>
        <AdminUiButton variant="primary" :disabled="!pinnedDirty || savingPinned" @click="savePinned">
          保存
        </AdminUiButton>
      </div>
      <ul class="divide-y divide-border-subtle overflow-hidden rounded-lg border border-solid border-border-subtle">
        <li v-for="article in publishedArticles" :key="article.id"
          class="px-4 py-2.5 transition-colors hover:bg-surface-muted">
          <AdminUiCheckbox :model-value="pinnedIds.includes(article.id)" @update:model-value="togglePinned(article.id)">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm">{{
                article.title || "無題"
                }}</span>
              <span class="block text-xs text-fg-muted">{{
                formatDate(article.publishedAt)
                }}</span>
            </span>
          </AdminUiCheckbox>
        </li>
        <li v-if="publishedArticles.length === 0" class="px-4 py-6 text-center text-sm text-fg-muted">
          公開中の記事はありません
        </li>
      </ul>
    </section>

    <AdminUiConfirmDialog v-model:open="deleteTagDialogOpen" title="タグを削除しますか？"
      :description="`「${deleteTagTarget?.name ?? ''}」を削除します。記事との紐付けも解除されます。`" confirm-label="削除する"
      @confirm="deleteTag" />
  </div>
</template>
