<script setup lang="ts">
definePageMeta({ layout: "admin" });

const route = useRoute();
const articleId = route.params.id as string;
const toast = useToast();

const { data: article, error } = await useFetch(
  `/api/admin/articles/${articleId}`,
);

useHead(() => ({ title: article.value?.title || "無題" }));

const title = ref(article.value?.title ?? "");
const contentDoc = shallowRef<TiptapDoc>(
  article.value?.content ?? emptyTiptapDoc(),
);
const tagIds = ref<string[]>(article.value?.tags.map((tag) => tag.id) ?? []);
const eyecatch = ref(article.value?.eyecatch ?? null);
const isNoIndex = ref(article.value?.isNoIndex ?? false);
const publishedAt = ref<string | null>(article.value?.publishedAt ?? null);
const status = ref<ArticleStatus>(article.value?.status ?? "draft");

const saveState = ref<"saved" | "dirty" | "saving" | "error">("saved");
const settingsOpen = ref(false);

const payload = computed(() => ({
  title: title.value,
  content: contentDoc.value,
  tagIds: tagIds.value,
  eyecatch: eyecatch.value
    ? {
        key: eyecatch.value.key,
        width: eyecatch.value.width ?? undefined,
        height: eyecatch.value.height ?? undefined,
      }
    : null,
  isNoIndex: isNoIndex.value,
  publishedAt: publishedAt.value,
}));

const save = async () => {
  if (!article.value) return;
  saveState.value = "saving";
  try {
    await $fetch(`/api/admin/articles/${articleId}`, {
      method: "PUT",
      body: payload.value,
    });
    saveState.value = "saved";
  } catch {
    saveState.value = "error";
    toast.error({ title: "保存に失敗しました" });
  }
};

watch(payload, () => {
  saveState.value = "dirty";
});

// 未保存のままの離脱を警告
const hasUnsavedChanges = () =>
  saveState.value === "dirty" || saveState.value === "saving";

const onBeforeUnload = (event: BeforeUnloadEvent) => {
  if (hasUnsavedChanges()) {
    event.preventDefault();
  }
};

// Cmd/Ctrl+Sで保存
const onKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "s") {
    event.preventDefault();
    if (saveState.value === "dirty" || saveState.value === "error") save();
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", onBeforeUnload);
  window.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  window.removeEventListener("keydown", onKeydown);
});

// アプリ内遷移は確認モーダルを表示
const leaveDialogOpen = ref(false);
let pendingLeavePath: string | null = null;
let leaveConfirmed = false;

onBeforeRouteLeave((to) => {
  if (leaveConfirmed || !hasUnsavedChanges()) return true;
  pendingLeavePath = to.fullPath;
  leaveDialogOpen.value = true;
  return false;
});

const confirmLeave = () => {
  leaveConfirmed = true;
  if (pendingLeavePath) navigateTo(pendingLeavePath);
};

const publishing = ref(false);
const publish = async () => {
  if (publishing.value) return;
  publishing.value = true;
  try {
    await save();
    const result = await $fetch(`/api/admin/articles/${articleId}/publish`, {
      method: "POST",
    });
    status.value = "published";
    publishedAt.value = result.publishedAt;
    toast.success({ title: "公開しました" });
  } catch {
    toast.error({ title: "公開に失敗しました" });
  } finally {
    publishing.value = false;
  }
};

const unpublish = async (target: "draft" | "private" = "draft") => {
  try {
    await $fetch(`/api/admin/articles/${articleId}/unpublish`, {
      method: "POST",
      body: { status: target },
    });
    status.value = target;
    toast.success({
      title: target === "draft" ? "下書きに戻しました" : "非公開にしました",
    });
  } catch {
    toast.error({ title: "操作に失敗しました" });
  }
};

const deleteArticle = async () => {
  try {
    await $fetch(`/api/admin/articles/${articleId}`, { method: "DELETE" });
    await navigateTo("/admin");
  } catch {
    toast.error({ title: "削除に失敗しました" });
  }
};

// 公開範囲ポップオーバ
const publishMenuOpen = ref(false);
const publishMenu = useTemplateRef<HTMLElement>("publishMenu");
onClickOutside(publishMenu, () => {
  publishMenuOpen.value = false;
});

const setStatus = async (target: ArticleStatus) => {
  publishMenuOpen.value = false;
  if (target === status.value) return;
  if (target === "published") {
    await publish();
  } else {
    await unpublish(target);
  }
};

const charCount = computed(() => countContentCharacters(contentDoc.value));

// 編集履歴
const historyOpen = ref(false);
const restoreRevision = (payload: { title: string; content: TiptapDoc }) => {
  title.value = payload.title;
  contentDoc.value = payload.content;
  editorRef.value?.setContent(payload.content);
  saveState.value = "dirty";
  toast.info({ title: "履歴を復元しました。保存で確定されます" });
};

// タイトルは単一行、Enterで本文へ
const editorRef = useTemplateRef<{
  focus: () => void;
  openImagePicker: () => void;
  setContent: (doc: TiptapDoc) => void;
  insertHardBreak: () => void;
}>("editorRef");
const titleArea = useTemplateRef<HTMLTextAreaElement>("titleArea");
const resizeTitle = () => {
  const element = titleArea.value;
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
};
watch(title, () => nextTick(resizeTitle));
onMounted(resizeTitle);

const onTitleEnter = (event: KeyboardEvent) => {
  event.preventDefault();
  editorRef.value?.focus();
};
</script>

<template>
  <div v-if="error" class="mx-auto max-w-2xl px-6 py-20 text-center">
    <p class="mb-4 text-fg-muted">記事が見つかりません</p>
    <NuxtLink to="/admin" class="text-sm underline">一覧へ戻る</NuxtLink>
  </div>

  <div v-else class="flex min-h-screen">
    <div class="min-w-0 flex-1">
      <header
        class="sticky top-0 z-10 grid grid-cols-3 items-center bg-surface/90 px-4 py-3 backdrop-blur"
      >
        <div class="flex items-center">
          <AdminUiButton to="/admin" variant="icon" title="閉じる">
            <Icon name="lucide:x" class="size-5" />
          </AdminUiButton>
        </div>

        <!-- 保存ピル(中央) -->
        <div class="flex justify-center">
          <button
            v-if="saveState === 'dirty' || saveState === 'error'"
            type="button"
            class="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border-none bg-fg px-4 text-xs font-bold text-surface transition-opacity hover:opacity-80"
            @click="save"
          >
            {{ saveState === "error" ? "保存に失敗(再試行)" : "保存する" }}
          </button>
          <span
            v-else
            class="inline-flex h-8 items-center gap-1 rounded-full bg-surface-muted px-4 text-xs text-fg-muted"
          >
            <Icon
              v-if="saveState === 'saved'"
              name="lucide:check"
              class="size-3.5"
            />
            {{ saveState === "saving" ? "保存中…" : "保存済み" }}
          </span>
        </div>

        <div class="flex items-center justify-end gap-2">
          <AdminUiButton
            v-if="status === 'published'"
            :to="`/entry/${articleId}`"
            target="_blank"
            variant="icon"
            title="記事を表示"
          >
            <Icon name="lucide:external-link" class="size-4" />
          </AdminUiButton>
          <AdminUiButton
            variant="icon"
            title="記事の設定"
            @click="settingsOpen = !settingsOpen"
          >
            <Icon name="lucide:settings-2" class="size-4" />
          </AdminUiButton>

          <!-- 公開範囲 -->
          <div ref="publishMenu" class="relative">
            <button
              type="button"
              class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-none px-3 text-xs font-medium transition-colors"
              :class="
                status === 'published'
                  ? 'bg-primary/15 text-accent hover:bg-primary/25'
                  : 'bg-surface-muted text-fg-muted hover:bg-border-subtle'
              "
              :disabled="publishing"
              @click="publishMenuOpen = !publishMenuOpen"
            >
              <Icon :name="ARTICLE_STATUS_ICONS[status]" class="size-3.5" />
              {{ ARTICLE_STATUS_LABELS[status] }}
            </button>
            <div
              v-if="publishMenuOpen"
              class="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-solid border-border-subtle bg-surface py-1 shadow-lg"
            >
              <p
                class="border-0 border-b border-solid border-border-subtle px-4 py-2 text-xs text-fg-muted"
              >
                公開範囲
              </p>
              <button
                v-for="option in ['draft', 'private', 'published'] as const"
                :key="option"
                type="button"
                class="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-4 py-2.5 text-left text-sm text-fg transition-colors hover:bg-surface-muted"
                @click="setStatus(option)"
              >
                <Icon
                  :name="ARTICLE_STATUS_ICONS[option]"
                  class="size-4 text-fg-muted"
                />
                <span class="flex-1">{{
                  option === "published" ? "公開" : ARTICLE_STATUS_LABELS[option]
                }}</span>
                <Icon
                  v-if="status === option"
                  name="lucide:check"
                  class="size-4 text-accent"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="mx-auto w-full max-w-2xl px-6 pb-20 pt-14">
        <textarea
          ref="titleArea"
          v-model="title"
          rows="1"
          placeholder="タイトル"
          class="mb-8 w-full resize-none overflow-hidden border-none bg-transparent p-0 text-2xl font-medium leading-snug outline-none placeholder:text-fg-muted/40"
          @keydown.enter="onTitleEnter"
        />
        <AdminEditor ref="editorRef" v-model="contentDoc" />
      </div>

      <!-- 左下ユーティリティ -->
      <div
        class="fixed bottom-4 left-4 z-10 flex items-center gap-1 rounded-full bg-surface/90 p-1 backdrop-blur"
      >
        <span
          class="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-solid border-border-subtle px-2 text-[10px] text-fg-muted"
          title="文字数"
        >
          {{ charCount }}
        </span>
        <AdminUiButton
          variant="icon"
          class="!size-8"
          title="画像を挿入"
          @click="editorRef?.openImagePicker()"
        >
          <Icon name="lucide:image" class="size-4" />
        </AdminUiButton>
        <AdminUiButton
          variant="icon"
          class="!size-8"
          title="編集履歴"
          @click="historyOpen = true"
        >
          <Icon name="lucide:history" class="size-4" />
        </AdminUiButton>
        <!-- モバイル用のshift+enter相当 -->
        <AdminUiButton
          variant="icon"
          class="!size-8 lg:!hidden"
          title="段落内改行"
          @click="editorRef?.insertHardBreak()"
        >
          <Icon name="lucide:corner-down-left" class="size-4" />
        </AdminUiButton>
      </div>

      <AdminHistoryDialog
        v-model:open="historyOpen"
        :article-id="articleId"
        @restore="restoreRevision"
      />

      <AdminUiConfirmDialog
        v-model:open="leaveDialogOpen"
        title="保存されていない変更があります"
        description="このまま移動すると変更内容は失われます。"
        confirm-label="破棄して移動"
        @confirm="confirmLeave"
      />
    </div>

    <!-- モバイルはオーバーレイ表示、バックドロップタップで閉じる -->
    <div
      v-if="settingsOpen"
      class="fixed inset-0 z-20 bg-black/30 lg:hidden"
      @click="settingsOpen = false"
    />
    <Transition name="settings-panel">
      <div
        v-if="settingsOpen"
        class="fixed inset-y-0 right-0 z-30 w-80 max-w-[85vw] lg:static lg:z-auto lg:max-w-none lg:shrink-0"
      >
        <div class="h-full lg:sticky lg:top-0 lg:h-screen">
          <AdminArticleSettingsPanel
            v-model:tag-ids="tagIds"
            v-model:eyecatch="eyecatch"
            v-model:is-no-index="isNoIndex"
            v-model:published-at="publishedAt"
            :article-id="articleId"
            :status="status"
            @unpublish="unpublish"
            @delete="deleteArticle"
            @close="settingsOpen = false"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-panel-enter-active,
.settings-panel-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.settings-panel-enter-from,
.settings-panel-leave-to {
  transform: translateX(1rem);
  opacity: 0;
}
</style>
