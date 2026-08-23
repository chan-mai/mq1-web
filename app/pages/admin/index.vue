<script setup lang="ts">
definePageMeta({ layout: "admin" });
useHead({ title: "記事の管理" });

const toast = useToast();
const {
  data,
  refresh,
  status: fetchStatus,
} = await useFetch("/api/admin/articles");

const articles = computed(() => data.value?.articles ?? []);
const publishedCount = computed(
  () =>
    articles.value.filter((article) => article.status === "published").length,
);
const draftCount = computed(
  () => articles.value.filter((article) => article.status === "draft").length,
);
const privateCount = computed(
  () => articles.value.filter((article) => article.status === "private").length,
);

// 検索・フィルタ・並び替え
const search = ref("");
const statusFilter = ref<"all" | ArticleStatus>("all");
const sortKey = ref<"updated-desc" | "published-desc" | "title">(
  "updated-desc",
);

const filteredArticles = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  let filtered = articles.value.filter((article) => {
    if (statusFilter.value !== "all" && article.status !== statusFilter.value) {
      return false;
    }
    if (!keyword) return true;
    return (
      article.title.toLowerCase().includes(keyword) ||
      article.id.toLowerCase().includes(keyword)
    );
  });
  switch (sortKey.value) {
    case "published-desc":
      filtered = [...filtered].sort(
        (a, b) =>
          Date.parse(b.publishedAt ?? b.updatedAt) -
          Date.parse(a.publishedAt ?? a.updatedAt),
      );
      break;
    case "title":
      filtered = [...filtered].sort((a, b) =>
        (a.title || "無題").localeCompare(b.title || "無題", "ja"),
      );
      break;
    default:
      filtered = [...filtered].sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      );
  }
  return filtered;
});

// 新規作成
const creating = ref(false);
const createArticle = async () => {
  if (creating.value) return;
  creating.value = true;
  try {
    const article = await $fetch("/api/admin/articles", {
      method: "POST",
      body: {},
    });
    await navigateTo(`/admin/edit/${article.id}`);
  } catch {
    toast.error({ title: "記事の作成に失敗しました" });
  } finally {
    creating.value = false;
  }
};

// 行メニュー
const menuOpenId = ref<string | null>(null);
const toggleMenu = (id: string) => {
  menuOpenId.value = menuOpenId.value === id ? null : id;
};
const closeMenu = () => {
  menuOpenId.value = null;
};
onMounted(() => document.addEventListener("click", closeMenu));
onBeforeUnmount(() => document.removeEventListener("click", closeMenu));

// 削除
const deleteTarget = ref<{ id: string; title: string } | null>(null);
const deleteDialogOpen = ref(false);
const requestDelete = (article: { id: string; title: string }) => {
  deleteTarget.value = article;
  deleteDialogOpen.value = true;
  menuOpenId.value = null;
};
const deleteArticle = async () => {
  if (!deleteTarget.value) return;
  try {
    await $fetch(`/api/admin/articles/${deleteTarget.value.id}`, {
      method: "DELETE",
    });
    await refresh();
    toast.success({ title: "記事を削除しました" });
  } catch {
    toast.error({ title: "削除に失敗しました" });
  } finally {
    deleteTarget.value = null;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-6 py-10">
    <header class="mb-6 flex items-center gap-3">
      <h1 class="text-xl font-bold">記事の管理</h1>
      <span class="text-xs text-fg-muted">
        公開中{{ publishedCount }} · 下書き{{ draftCount
        }}<template v-if="privateCount > 0">
          · 非公開{{ privateCount }}</template
        >
      </span>
      <div class="ml-auto flex items-center gap-2">
        <AdminUiButton to="/admin/media" variant="icon" title="画像の管理">
          <Icon name="lucide:images" class="size-5" />
        </AdminUiButton>
        <AdminUiButton to="/admin/settings" variant="icon" title="サイト設定">
          <Icon name="lucide:settings" class="size-5" />
        </AdminUiButton>
        <AdminUiButton
          variant="primary"
          :disabled="creating"
          @click="createArticle"
        >
          書く
        </AdminUiButton>
      </div>
    </header>

    <!-- ツールバー -->
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <div class="relative">
        <Icon
          name="lucide:search"
          class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted"
        />
        <input
          v-model="search"
          placeholder="タイトル・IDで検索"
          class="h-8 w-64 rounded-md border border-solid border-border-subtle bg-surface pl-8 pr-2 text-xs outline-none transition-colors focus:border-fg"
        />
      </div>
      <select
        v-model="statusFilter"
        class="h-8 cursor-pointer rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none"
      >
        <option value="all">すべての状態</option>
        <option value="published">公開中</option>
        <option value="draft">下書き</option>
        <option value="private">非公開</option>
      </select>
      <select
        v-model="sortKey"
        class="h-8 cursor-pointer rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none"
      >
        <option value="updated-desc">更新が新しい順</option>
        <option value="published-desc">公開が新しい順</option>
        <option value="title">タイトル順</option>
      </select>
      <span class="ml-auto text-xs text-fg-muted">
        {{ filteredArticles.length }}件
      </span>
    </div>

    <p
      v-if="fetchStatus === 'pending'"
      class="py-16 text-center text-sm text-fg-muted"
    >
      読み込み中…
    </p>
    <p
      v-else-if="filteredArticles.length === 0"
      class="py-16 text-center text-sm text-fg-muted"
    >
      {{
        search || statusFilter !== "all"
          ? "一致する記事がありません"
          : "記事はまだありません"
      }}
    </p>

    <div
      v-else
      class="overflow-hidden rounded-xl border border-solid border-border-subtle"
    >
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr
            class="border-0 border-b border-solid border-border-subtle bg-surface-muted/60 text-left text-xs text-fg-muted"
          >
            <th class="w-24 px-4 py-2.5 font-normal">OGP</th>
            <th class="px-2 py-2.5 font-normal">タイトル</th>
            <th class="w-20 px-2 py-2.5 font-normal">状態</th>
            <th class="hidden px-2 py-2.5 font-normal md:table-cell">タグ</th>
            <th
              class="hidden w-20 px-2 py-2.5 text-right font-normal md:table-cell"
            >
              文字数
            </th>
            <th class="hidden w-24 px-2 py-2.5 font-normal sm:table-cell">
              公開日
            </th>
            <th class="hidden w-24 px-2 py-2.5 font-normal sm:table-cell">
              更新日
            </th>
            <th class="w-12 px-2 py-2.5" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="article in filteredArticles"
            :key="article.id"
            class="cursor-pointer border-0 border-b border-solid border-border-subtle transition-colors last:border-b-0 hover:bg-surface-muted/60"
            @click="navigateTo(`/admin/edit/${article.id}`)"
          >
            <td class="px-4 py-2.5">
              <div
                class="relative aspect-[1200/630] w-16 overflow-hidden rounded bg-surface-muted"
              >
                <img
                  v-if="article.status === 'published'"
                  :src="`/api/og/article/${article.id}?v=2`"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 size-full object-cover"
                />
                <img
                  v-else-if="article.eyecatch?.url"
                  :src="article.eyecatch.url"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 size-full object-cover"
                />
                <Icon
                  v-else
                  name="lucide:file-text"
                  class="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-fg-muted/50"
                />
              </div>
            </td>
            <td class="max-w-0 px-2 py-2.5">
              <p class="truncate" :class="{ 'text-fg-muted': !article.title }">
                {{ article.title || "無題" }}
              </p>
              <p class="truncate font-mono text-[10px] text-fg-muted">
                {{ article.id }}
              </p>
            </td>
            <td class="px-2 py-2.5">
              <span
                class="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px]"
                :class="
                  article.status === 'published'
                    ? 'bg-primary/15 text-accent'
                    : 'bg-surface-muted text-fg-muted'
                "
              >
                {{ ARTICLE_STATUS_LABELS[article.status] }}
              </span>
            </td>
            <td class="hidden max-w-0 px-2 py-2.5 md:table-cell">
              <p class="truncate text-xs text-fg-muted">
                <template v-if="article.tags.length > 0">
                  {{ article.tags.map((tag) => `#${tag.name}`).join(" ") }}
                </template>
                <template v-else>—</template>
              </p>
            </td>
            <td
              class="hidden px-2 py-2.5 text-right text-xs text-fg-muted md:table-cell"
            >
              {{ article.charCount.toLocaleString() }}
            </td>
            <td class="hidden px-2 py-2.5 text-xs text-fg-muted sm:table-cell">
              {{
                formatDate(
                  article.status === "published" ? article.publishedAt : null,
                )
              }}
            </td>
            <td class="hidden px-2 py-2.5 text-xs text-fg-muted sm:table-cell">
              {{ formatDate(article.updatedAt) }}
            </td>
            <td class="relative px-2 py-2.5" @click.stop>
              <button
                type="button"
                class="flex size-7 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
                @click.stop="toggleMenu(article.id)"
              >
                <Icon name="lucide:ellipsis-vertical" class="size-4" />
              </button>
              <div
                v-if="menuOpenId === article.id"
                class="absolute right-8 top-2 z-20 w-40 overflow-hidden rounded-xl border border-solid border-border-subtle bg-surface py-1 shadow-lg"
                @click.stop
              >
                <NuxtLink
                  :to="`/admin/edit/${article.id}`"
                  class="block px-4 py-2 text-sm text-fg transition-colors hover:bg-surface-muted"
                >
                  編集
                </NuxtLink>
                <NuxtLink
                  v-if="article.status === 'published'"
                  :to="`/entry/${article.id}`"
                  target="_blank"
                  class="block px-4 py-2 text-sm text-fg transition-colors hover:bg-surface-muted"
                >
                  記事を表示
                </NuxtLink>
                <button
                  type="button"
                  class="block w-full cursor-pointer border-none bg-transparent px-4 py-2 text-left text-sm text-red-500 transition-colors hover:bg-surface-muted"
                  @click="requestDelete(article)"
                >
                  削除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminUiConfirmDialog
      v-model:open="deleteDialogOpen"
      title="記事を削除しますか？"
      :description="`「${deleteTarget?.title || '無題'}」を削除します。この操作は取り消せません。`"
      confirm-label="削除する"
      @confirm="deleteArticle"
    />
  </div>
</template>
