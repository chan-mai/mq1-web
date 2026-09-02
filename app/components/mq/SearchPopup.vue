<script setup lang="ts">
// NOTE: body teleportのhydration不整合回避
const isMounted = useMounted();
const isOpen = ref(false);

interface SearchTag {
  id: string;
  type: string;
  value: string;
  raw: string;
}

interface SearchResult {
  id: string;
  type: 'article' | 'tag';
  title: string;
  hasTags?: Tag[];
  to: string;
}

const searchOptions = ref<SearchTag[]>([]);
const searchInput = ref('');
const results = ref<SearchResult[]>([]);
const isSearching = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(-1);

const open = () => {
  isOpen.value = true;
  nextTick(() => {
    searchInputRef.value?.focus();
  });
};

const close = () => {
  isOpen.value = false;
};

const performSearch = async () => {
  // 検索入力なしかつオプションもなければリセットして終了
  if (!searchInput.value.trim() && searchOptions.value.length === 0) {
    results.value = [];
    return;
  }

  isSearching.value = true;
  try {
    const query: Record<string, string> = {};

    // タグ系(AND検索、slugのままAPIへ)
    const tagOptions = searchOptions.value.filter((o) => o.type === 'tag');
    if (tagOptions.length > 0) {
      query.tags = tagOptions.map((t) => t.value).join(',');
    }

    // 日付系
    searchOptions.value.forEach((opt) => {
      if (opt.type === 'since') {
        const date = new Date(`${opt.value}T00:00:00`);
        if (!isNaN(date.getTime())) {
          query.since = date.toISOString();
        }
      }
      if (opt.type === 'until') {
        const date = new Date(`${opt.value}T23:59:59.999`);
        if (!isNaN(date.getTime())) {
          query.until = date.toISOString();
        }
      }
    });

    if (searchInput.value.trim()) {
      query.q = searchInput.value.trim();
    }

    const response = await $fetch('/api/search', { query });

    const articleResults: SearchResult[] = response.contents.map((a) => ({
      id: a.id,
      type: 'article',
      title: a.title || a.id,
      hasTags: a.tags,
      to: `/entry/${a.id}`,
    }));

    // 検索オプション(tag)がある場合、そのタグページへのリンクも結果に含める
    const directTagOptions = searchOptions.value.filter(
      (o) => o.type === 'tag',
    );
    const directTagResults: SearchResult[] = directTagOptions.map((t) => ({
      id: `tag-option-${t.value}`,
      type: 'tag',
      title: `#${t.value}`,
      to: `/tag/${t.value}`,
    }));

    results.value = [...directTagResults, ...articleResults];
  } catch (error) {
    console.error('Search failed:', error);
    results.value = [];
  } finally {
    isSearching.value = false;
  }
};

const debouncedSearch = useDebounceFn(performSearch, 500);

watch(
  [searchInput, searchOptions],
  () => {
    debouncedSearch();
  },
  { deep: true },
);

// 結果が更新されたら選択をリセット
watch(results, () => {
  selectedIndex.value = -1;
});

const extractSearchOptions = (
  text: string,
): { remainingText: string; extractedParams: SearchTag[] } => {
  const params: SearchTag[] = [];
  let remaining = text;

  // 検索オプションを抽出
  const regex = /(tag|since|until):([^\s]+)/g;

  // 破壊的にマッチしたものを収集
  remaining = remaining.replace(regex, (substring, type, value) => {
    if (type === 'since' || type === 'until') {
      // 月日を2桁に揃える
      value = value.replace(/\b\d{1}\b/g, (n: string) => {
        return '0' + n;
      });
    } else if (type === 'tag') {
      // #が先頭にあれば削除
      value = value.replace(/^#/, '');
    }
    params.push({
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      type: type, // tag, since, until
      value: value,
      raw: substring,
    });
    return ' '; // 該当部分をスペースに置換
  });

  // 余分な空白を整理
  remaining = remaining.replace(/\s+/g, ' ').trim();

  return { remainingText: remaining, extractedParams: params };
};

const processInput = () => {
  // 現在の入力からオプションを抽出
  const { remainingText, extractedParams } = extractSearchOptions(
    searchInput.value,
  );

  if (extractedParams.length > 0) {
    searchOptions.value.push(...extractedParams);
    searchInput.value = remainingText;
  }
};

const removeSearchOption = (id: string) => {
  searchOptions.value = searchOptions.value.filter((t) => t.id !== id);
};

const triggerSelect = () => {
  // 選択中のアイテムがあれば遷移
  if (selectedIndex.value >= 0 && results.value[selectedIndex.value]) {
    const selected = results.value[selectedIndex.value];
    if (selected) {
      navigateTo(selected.to);
      close();
      return;
    }
  }

  processInput(); // Enter時は確定として解析実行
  performSearch(); // 即時検索
};

const navigateDown = () => {
  if (results.value.length > 0) {
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length;
  }
};

const navigateUp = () => {
  if (results.value.length > 0) {
    selectedIndex.value =
      (selectedIndex.value - 1 + results.value.length) % results.value.length;
  }
};

const handleInputKeydown = (e: KeyboardEvent) => {
  if (e.isComposing) return; // IME変換中

  if (e.key === 'Enter') {
    e.preventDefault();
    triggerSelect();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    navigateDown();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    navigateUp();
  } else if (e.key === ' ' || e.key === 'Spacebar') {
    // 入力中の文字列にパターンが含まれていれば抽出
    const current = searchInput.value;
    if (/(tag|since|until):([^\s]+)/.test(current)) {
      e.preventDefault();
      processInput();
    }
  } else if (e.key === 'Backspace' && searchInput.value === '') {
    // 入力が空でBSが押下されたら最後のを削除
    if (searchOptions.value.length > 0) {
      searchOptions.value.pop();
    }
  }
};

const onPaste = () => {
  // ペースト→inputイベント→v-model更新のサイクルを確実に待つためにsetTimeout
  setTimeout(() => {
    processInput();
  }, 10);
};

// SiteHeaderからアクセスできるようにexposeする
defineExpose({
  open,
  close,
});

const onKeyDown = (e: KeyboardEvent) => {
  // グローバルな処理のみ, 個別bindは無視
  if (
    (e.key === 's' || e.key === 'S' || e.key === '/') &&
    !isOpen.value &&
    document.activeElement?.tagName !== 'INPUT' &&
    document.activeElement?.tagName !== 'TEXTAREA'
  ) {
    e.preventDefault();
    open();
  }
  if (e.key === 'Escape' && isOpen.value) {
    close();
  }
};

onMounted(() => {
  document.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <teleport v-if="isMounted" to="body">
    <!-- Backdrop -->
    <transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" @click="close"></div>
    </transition>

    <!-- Modal -->
    <transition name="modal">
      <div v-if="isOpen"
        class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 pointer-events-none">
        <!-- 本体 -->
        <div role="dialog" aria-modal="true" aria-label="検索"
          class="pointer-events-auto relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface-elevated shadow-2xl ring-1 ring-black/5">
          <!-- 検索 -->
          <div class="relative flex items-center border-b border-border-subtle px-4 py-3">
            <Icon name="material-symbols:search" class="mr-3 h-6 w-6 shrink-0 text-primary" />

            <div class="flex flex-1 flex-wrap items-center gap-2">
              <!-- 検索オプション -->
              <div v-for="tag in searchOptions" :key="tag.id"
                class="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-sm text-primary">
                <span class="font-medium">{{ tag.type }}:</span>
                <span>{{ tag.value }}</span>
                <button type="button" @click="removeSearchOption(tag.id)"
                  class="flex items-center justify-center ml-1 border-none hover:bg-primary/20">
                  <Icon name="material-symbols:close" class="size-4" />
                </button>
              </div>

              <input type="text" ref="searchInputRef" v-model="searchInput"
                class="min-w-[50px] flex-1 border-0 bg-transparent p-0 text-lg text-fg placeholder:text-fg-muted focus:ring-0 sm:text-sm outline-none ring-0 border-none focus:outline-none focus:border-none"
                :placeholder="searchOptions.length === 0 ? '検索' : ''" aria-label="検索キーワード" autofocus
                @keydown="handleInputKeydown" @paste="onPaste" />
            </div>
          </div>

          <!-- 結果 -->
          <div class="max-h-[60vh] overflow-y-auto px-4 py-4">
            <div v-if="isSearching" class="flex justify-center py-4">
              <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>

            <div v-else-if="results.length > 0">
              <div class="font-futura mb-2 text-xs font-semibold text-fg-muted">
                Results: ({{ results.length }})
              </div>
              <ul class="space-y-2">
                <li v-for="(result, index) in results" :key="result.id">
                  <NuxtLink :to="result.to" @click="close"
                    class="group flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors"
                    :class="index === selectedIndex
                      ? 'bg-primary/10 text-primary ring-1 ring-primary'
                      : 'bg-surface-muted/50 hover:bg-primary/10 hover:text-primary hover:ring-1 hover:ring-primary'
                      " @mouseover="selectedIndex = index">
                    <div class="flex items-center gap-3">
                      <Icon v-if="result.type === 'tag'" name="lucide:tag" class="h-5 w-5" :class="index === selectedIndex
                        ? 'text-primary'
                        : 'text-fg-muted group-hover:text-primary'
                        " />
                      <Icon v-if="result.type === 'article'" name="lucide:file-pen-line" class="h-5 w-5" :class="index === selectedIndex
                        ? 'text-primary'
                        : 'text-fg-muted group-hover:text-primary'
                        " />
                      <div class="flex flex-col">
                        <span class="text-sm font-medium" :class="index === selectedIndex
                          ? 'text-primary'
                          : 'text-fg group-hover:text-primary'
                          ">
                          {{ result.title }}
                        </span>

                        <!-- type:articleかつhasTags -->
                        <div v-if="result.type === 'article' && result.hasTags" class="flex">
                          <MqTag v-for="tag in result.hasTags" :key="tag.id" :tag="tag" variant="compact" transition />
                        </div>
                      </div>
                    </div>
                    <Icon name="material-symbols:chevron-right" class="h-5 w-5" :class="index === selectedIndex
                      ? 'text-primary'
                      : 'text-fg-muted group-hover:text-primary'
                      " />
                  </NuxtLink>
                </li>
              </ul>
            </div>

            <!-- 初期 -->
            <div v-else class="py-4">
              <!-- 検索条件があり、検索完了後で結果なし -->
              <div v-if="searchInput || searchOptions.length > 0" class="text-center text-fg-muted">
                <p>検索結果が見つかりませんでした。</p>
              </div>

              <!-- 初期状態 -->
              <div v-else>
                <div class="text-center py-10 text-fg-muted text-sm">
                  <p>キーワードを入力して検索</p>
                  <p>
                    タグ(tag:slug)や日付(since:yyyy-mm-dd,
                    until:yyyy-mm-dd)が利用できます
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex items-center justify-end border-t border-border-subtle bg-surface-muted px-4 py-2.5 md:justify-between">
            <div class="hidden text-xs text-fg-muted md:flex flex-1 gap-4">
              <button type="button" @click="triggerSelect"
                class="flex items-center gap-1 hover:bg-surface-muted rounded px-1 -ml-1 transition-colors cursor-pointer border-none outline-none">
                <kbd
                  class="flex h-5 items-center justify-center rounded border border-border-subtle bg-surface-elevated px-1.5 font-sans text-[10px] font-medium text-fg-muted shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)]">↵</kbd>
                <span class="font-futura">to select</span>
              </button>
              <div class="flex items-center gap-1">
                <button type="button" @click="navigateDown"
                  class="flex h-5 items-center justify-center rounded border border-border-subtle bg-surface-elevated px-1.5 font-sans text-[10px] font-medium text-fg-muted shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:bg-surface-muted hover:border-primary/40 transition-colors cursor-pointer outline-none">
                  ↓
                </button>
                <button type="button" @click="navigateUp"
                  class="flex h-5 items-center justify-center rounded border border-border-subtle bg-surface-elevated px-1.5 font-sans text-[10px] font-medium text-fg-muted shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:bg-surface-muted hover:border-primary/40 transition-colors cursor-pointer outline-none">
                  ↑
                </button>
                <span class="font-futura">to navigate</span>
              </div>
              <button type="button" @click="close"
                class="flex items-center gap-1 hover:bg-surface-muted rounded px-1 -ml-1 transition-colors cursor-pointer border-none outline-none">
                <kbd
                  class="flex h-5 items-center justify-center rounded border border-border-subtle bg-surface-elevated px-1.5 font-sans text-[10px] font-medium text-fg-muted shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)]">esc</kbd>
                <span class="font-futura">to close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
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
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
