<script setup lang="ts">
const props = defineProps<{
  articleId: string;
}>();

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  restore: [payload: { title: string; content: TiptapDoc }];
}>();

const toast = useToast();

interface RevisionSummary {
  id: string;
  title: string;
  createdAt: string;
}

interface RevisionDetail {
  id: string;
  title: string;
  content: TiptapDoc;
  createdAt: string;
}

const revisions = ref<RevisionSummary[]>([]);
const loadingList = ref(false);
const selectedId = ref<string | null>(null);
const preview = ref<RevisionDetail | null>(null);
// 1つ前(古い方)のリビジョン
const previous = ref<RevisionDetail | null>(null);
const loadingPreview = ref(false);
const viewMode = ref<'diff' | 'preview'>('diff');

const revisionCache = new Map<string, RevisionDetail>();

const fetchRevision = async (revisionId: string): Promise<RevisionDetail> => {
  const cached = revisionCache.get(revisionId);
  if (cached) return cached;
  const detail = await $fetch<RevisionDetail>(
    `/api/admin/articles/${props.articleId}/revisions/${revisionId}` as string,
  );
  revisionCache.set(revisionId, detail);
  return detail;
};

watch(open, async (value) => {
  if (!value) return;
  selectedId.value = null;
  preview.value = null;
  previous.value = null;
  viewMode.value = 'diff';
  loadingList.value = true;
  try {
    const response = await $fetch<{ revisions: RevisionSummary[] }>(
      `/api/admin/articles/${props.articleId}/revisions` as string,
    );
    revisions.value = response.revisions;
    if (response.revisions[0]) selectRevision(response.revisions[0].id);
  } catch {
    toast.error({ title: '履歴の取得に失敗しました' });
  } finally {
    loadingList.value = false;
  }
});

const selectRevision = async (revisionId: string) => {
  selectedId.value = revisionId;
  loadingPreview.value = true;
  try {
    const index = revisions.value.findIndex(
      (revision) => revision.id === revisionId,
    );
    const previousSummary = revisions.value[index + 1];
    const [detail, previousDetail] = await Promise.all([
      fetchRevision(revisionId),
      previousSummary ? fetchRevision(previousSummary.id) : null,
    ]);
    if (selectedId.value !== revisionId) return;
    preview.value = detail;
    previous.value = previousDetail;
  } catch {
    toast.error({ title: '履歴の取得に失敗しました' });
  } finally {
    if (selectedId.value === revisionId) loadingPreview.value = false;
  }
};

const titleChanged = computed(
  () => previous.value && previous.value.title !== preview.value?.title,
);

// 文字+装飾単位の差分をレンダリング済みの見た目で表示
const diffHtml = computed(() => {
  if (!preview.value) return '';
  return renderArticleDiffHtml(
    previous.value?.content ?? null,
    preview.value.content,
  );
});

const restore = () => {
  if (!preview.value) return;
  emit('restore', {
    title: preview.value.title,
    content: preview.value.content,
  });
  open.value = false;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="admin-root fixed inset-0 z-50 flex items-center justify-center p-6"
    >
      <div class="absolute inset-0 bg-black/40" @click="open = false" />
      <div
        class="relative flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-surface text-fg shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="flex items-center justify-between border-0 border-b border-solid border-border-subtle px-6 py-4"
        >
          <p class="font-bold">編集履歴</p>
          <AdminUiButton variant="icon" class="!size-8" @click="open = false">
            <Icon name="lucide:x" class="size-4" />
          </AdminUiButton>
        </div>

        <div class="flex min-h-0 flex-1">
          <!-- 履歴一覧 -->
          <div
            class="w-56 shrink-0 overflow-y-auto border-0 border-r border-solid border-border-subtle py-2"
          >
            <p
              v-if="loadingList"
              class="px-4 py-6 text-center text-xs text-fg-muted"
            >
              読み込み中…
            </p>
            <p
              v-else-if="revisions.length === 0"
              class="px-4 py-6 text-center text-xs text-fg-muted"
            >
              履歴はありません
            </p>
            <button
              v-for="revision in revisions"
              :key="revision.id"
              type="button"
              class="block w-full cursor-pointer border-none px-4 py-2.5 text-left transition-colors"
              :class="
                selectedId === revision.id
                  ? 'bg-surface-muted text-fg'
                  : 'bg-transparent text-fg-muted hover:bg-surface-muted/60'
              "
              @click="selectRevision(revision.id)"
            >
              <span class="block text-xs">{{
                formatDateTime(revision.createdAt)
              }}</span>
              <span class="mt-0.5 block truncate text-xs text-fg-muted">{{
                revision.title || '無題'
              }}</span>
            </button>
          </div>

          <!-- 差分 / プレビュー -->
          <div class="flex min-w-0 flex-1 flex-col">
            <div
              class="flex items-center gap-1 border-0 border-b border-solid border-border-subtle px-6 py-2"
            >
              <button
                v-for="tab in [
                  { key: 'diff', label: '差分' },
                  { key: 'preview', label: 'プレビュー' },
                ] as const"
                :key="tab.key"
                type="button"
                class="cursor-pointer rounded-full border-none px-3 py-1 text-xs transition-colors"
                :class="
                  viewMode === tab.key
                    ? 'bg-fg font-bold text-surface'
                    : 'bg-transparent text-fg-muted hover:bg-surface-muted'
                "
                @click="viewMode = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-8 py-6">
              <p
                v-if="loadingPreview"
                class="py-10 text-center text-sm text-fg-muted"
              >
                読み込み中…
              </p>

              <!-- 差分(1つ前のリビジョンとの比較) -->
              <template v-else-if="preview && viewMode === 'diff'">
                <p v-if="titleChanged" class="mb-4 text-sm">
                  <span
                    class="mr-2 rounded bg-red-500/15 px-1.5 py-0.5 text-red-600 line-through"
                    >{{ previous?.title || '無題' }}</span
                  >
                  <span
                    class="rounded bg-green-500/15 px-1.5 py-0.5 text-green-800"
                    >{{ preview.title || '無題' }}</span
                  >
                </p>
                <!-- 自身の記事のレンダリング結果のみを描画 -->
                <div class="history-diff" v-html="diffHtml" />
                <p v-if="!previous" class="mt-6 text-xs text-fg-muted">
                  最古の履歴のため全文が追加として表示されています
                </p>
              </template>

              <!-- プレビュー -->
              <template v-else-if="preview">
                <h2 class="mb-6 text-xl font-medium">
                  {{ preview.title || '無題' }}
                </h2>
                <MqArticleBody :doc="preview.content" />
              </template>
            </div>

            <div
              class="flex justify-end border-0 border-t border-solid border-border-subtle px-6 py-3"
            >
              <AdminUiButton
                variant="primary"
                :disabled="!preview"
                @click="restore"
              >
                この履歴を復元
              </AdminUiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
.history-diff {
  @apply text-sm leading-relaxed;
}

.history-diff p {
  @apply my-2;
}

.history-diff h1,
.history-diff h2 {
  @apply mb-2 mt-6 text-xl font-bold;
}

.history-diff h3 {
  @apply mb-2 mt-5 text-lg font-bold;
}

.history-diff h4 {
  @apply mb-2 mt-4 text-base font-bold;
}

.history-diff pre {
  @apply my-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-muted p-3 font-mono text-xs leading-relaxed;
}

.history-diff code {
  @apply rounded bg-surface-muted px-1 text-[0.85em];
}

.history-diff hr {
  @apply my-4 border-border-subtle;
}

.history-diff .diff-quote {
  @apply border-0 border-l-2 border-solid border-border-subtle pl-3 text-fg-muted;
}

.history-diff .diff-li {
  @apply my-1 pl-4;
}

.history-diff .diff-row {
  @apply my-1 font-mono text-xs;
}

.history-diff .diff-prefix {
  @apply text-fg-muted;
}

.history-diff .diff-img {
  @apply my-2 max-h-40 rounded;
}

.history-diff .diff-caption {
  @apply ml-2 text-xs text-fg-muted;
}

.history-diff .diff-card {
  @apply my-2 rounded-lg border border-solid border-border-subtle px-3 py-2 text-xs text-fg-muted;
}

.history-diff .diff-link {
  @apply text-primary underline;
}

.history-diff ins {
  @apply rounded bg-green-500/15 text-green-800 no-underline;
}

.history-diff del {
  @apply rounded bg-red-500/15 text-red-600;
}

.history-diff ins .diff-img {
  @apply ring-2 ring-green-500/40;
}

.history-diff del .diff-img {
  @apply opacity-60 ring-2 ring-red-500/40;
}
</style>
