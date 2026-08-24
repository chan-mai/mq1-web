<script setup lang="ts">
interface Props {
  totalCount: number;
  currentPage: number;
  limit: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'change', page: number): void;
}>();

const totalPages = computed(() => Math.ceil(props.totalCount / props.limit));

// ページネーションの表示ロジック
const pages = computed(() => {
  const current = props.currentPage;
  const total = totalPages.value;
  const delta = 2; // 現在のページの前後に表示するページ数
  const range = [];
  const rangeWithDots = [];
  let l;

  range.push(1);

  if (total <= 1) return [1];

  for (let i = current - delta; i <= current + delta; i++) {
    if (i < total && i > 1) {
      range.push(i);
    }
  }
  range.push(total);

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
});

const onPageClick = (page: number | string) => {
  if (typeof page === 'number' && page !== props.currentPage) {
    emit('change', page);
  }
};

const onPrevClick = () => {
  if (props.currentPage > 1) {
    emit('change', props.currentPage - 1);
  }
};

const onNextClick = () => {
  if (props.currentPage < totalPages.value) {
    emit('change', props.currentPage + 1);
  }
};
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex justify-center items-center gap-2 mt-12"
    aria-label="Pagination"
  >
    <!-- まえ -->
    <button
      @click="onPrevClick"
      :disabled="currentPage === 1"
      class="p-2 flex items-center justify-center border-none rounded-lg hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label="Previous page"
    >
      <Icon
        name="material-symbols:chevron-left"
        class="w-6 h-6 text-fg-muted"
      />
    </button>

    <!-- ページ番号 -->
    <div class="flex items-center gap-1">
      <template v-for="(page, index) in pages" :key="index">
        <button
          v-if="typeof page === 'number'"
          @click="onPageClick(page)"
          :class="[
            'flex items-center justify-center border-none w-10 h-10 rounded-lg text-sm font-medium transition-colors',
            currentPage === page
              ? 'bg-primary text-white'
              : 'text-fg-muted hover:bg-surface-muted',
          ]"
          :aria-current="currentPage === page ? 'page' : undefined"
        >
          {{ page }}
        </button>
        <span
          v-else
          class="w-10 h-10 flex items-center justify-center text-fg-muted"
        >
          ...
        </span>
      </template>
    </div>

    <!-- つぎ -->
    <button
      @click="onNextClick"
      :disabled="currentPage === totalPages"
      class="p-2 flex items-center justify-center border-none rounded-lg hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label="Next page"
    >
      <Icon
        name="material-symbols:chevron-right"
        class="w-6 h-6 text-fg-muted"
      />
    </button>
  </nav>
</template>
