<script setup lang="ts">
definePageMeta({ layout: 'admin' });
useHead({ title: '画像の管理' });

const toast = useToast();
const { upload: uploadImage } = useImageUpload();

interface MediaImage {
  key: string;
  url: string;
  size: number;
  uploaded: string;
}

interface MediaDetail extends MediaImage {
  contentType: string | null;
  usedBy: { id: string; title: string; status: ArticleStatus }[];
}

// 一覧(検索・並び替えのため全件読み込み)
const images = ref<MediaImage[]>([]);
const loading = ref(false);

const loadAll = async () => {
  loading.value = true;
  try {
    const response = await $fetch<{ images: MediaImage[] }>(
      '/api/admin/images',
    );
    images.value = response.images;
  } catch {
    toast.error({ title: '画像の取得に失敗しました' });
  } finally {
    loading.value = false;
  }
};

onMounted(loadAll);

// 検索・並び替え・期間
const search = ref('');
const sortKey = ref<'uploaded-desc' | 'uploaded-asc' | 'size-desc'>(
  'uploaded-desc',
);
const dateFrom = ref('');
const dateTo = ref('');

const clearPeriod = () => {
  dateFrom.value = '';
  dateTo.value = '';
};

const filteredImages = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  let filtered = keyword
    ? images.value.filter((image) => image.key.toLowerCase().includes(keyword))
    : [...images.value];

  if (dateFrom.value) {
    const from = Date.parse(`${dateFrom.value}T00:00:00`);
    if (!Number.isNaN(from)) {
      filtered = filtered.filter((image) => Date.parse(image.uploaded) >= from);
    }
  }
  if (dateTo.value) {
    const to = Date.parse(`${dateTo.value}T23:59:59.999`);
    if (!Number.isNaN(to)) {
      filtered = filtered.filter((image) => Date.parse(image.uploaded) <= to);
    }
  }

  switch (sortKey.value) {
    case 'uploaded-asc':
      return filtered.sort(
        (a, b) => Date.parse(a.uploaded) - Date.parse(b.uploaded),
      );
    case 'size-desc':
      return filtered.sort((a, b) => b.size - a.size);
    default:
      return filtered.sort(
        (a, b) => Date.parse(b.uploaded) - Date.parse(a.uploaded),
      );
  }
});

// 月ごとのセクション(サイズ順は区切りなし)
const groupedImages = computed(() => {
  if (sortKey.value === 'size-desc') {
    return [{ label: '', images: filteredImages.value }];
  }
  const groups: { label: string; images: MediaImage[] }[] = [];
  for (const image of filteredImages.value) {
    const date = new Date(image.uploaded);
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    const current = groups[groups.length - 1];
    if (current?.label === label) {
      current.images.push(image);
    } else {
      groups.push({ label, images: [image] });
    }
  }
  return groups;
});

const totalSize = computed(() =>
  images.value.reduce((sum, image) => sum + image.size, 0),
);

// 詳細
const selectedKey = ref<string | null>(null);
const detail = ref<MediaDetail | null>(null);
const loadingDetail = ref(false);
const dimensions = ref<{ width: number; height: number } | null>(null);

const select = async (image: MediaImage) => {
  selectedKey.value = image.key;
  loadingDetail.value = true;
  dimensions.value = null;
  try {
    const result = await $fetch<MediaDetail>(
      `/api/admin/images/${image.key}` as string,
    );
    if (selectedKey.value !== image.key) return;
    detail.value = result;
  } catch {
    toast.error({ title: '詳細の取得に失敗しました' });
  } finally {
    if (selectedKey.value === image.key) loadingDetail.value = false;
  }
};

const closeDetail = () => {
  selectedKey.value = null;
  detail.value = null;
};

const onPreviewLoad = (event: Event) => {
  const image = event.target as HTMLImageElement;
  dimensions.value = {
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
};

const copyUrl = async (image: MediaImage) => {
  await navigator.clipboard.writeText(`${window.location.origin}${image.url}`);
  toast.success({ title: 'URLをコピーしました' });
};

// アップロード
const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const uploadingCount = ref(0);
const dragging = ref(false);

const uploadFiles = async (files: File[]) => {
  const targets = files.filter((file) => file.type.startsWith('image/'));
  for (const file of targets) {
    uploadingCount.value += 1;
    try {
      const uploaded = await uploadImage(file);
      const item: MediaImage = {
        key: uploaded.key,
        url: uploaded.url,
        size: file.size,
        uploaded: new Date().toISOString(),
      };
      images.value = [item, ...images.value];
      select(item);
    } catch {
      toast.error({ title: 'アップロードに失敗しました' });
    } finally {
      uploadingCount.value -= 1;
    }
  }
};

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  uploadFiles(Array.from(input.files ?? []));
  input.value = '';
};

const onDrop = (event: DragEvent) => {
  dragging.value = false;
  uploadFiles(Array.from(event.dataTransfer?.files ?? []));
};

// 削除
const deleteDialogOpen = ref(false);
const deleteImage = async () => {
  const target = detail.value;
  if (!target) return;
  try {
    await $fetch(`/api/admin/images/${target.key}` as string, {
      method: 'DELETE',
    });
    images.value = images.value.filter((image) => image.key !== target.key);
    closeDetail();
    toast.success({ title: '画像を削除しました' });
  } catch (error: unknown) {
    const status = (error as { statusCode?: number })?.statusCode;
    if (status === 409) {
      toast.error({ title: '記事で使用中のため削除できません' });
    } else {
      toast.error({ title: '削除に失敗しました' });
    }
  }
};

const formatSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
</script>

<template>
  <div class="flex min-h-screen">
    <!-- 一覧 -->
    <div class="min-w-0 flex-1 px-6 py-10">
      <header class="mb-6 flex items-center gap-3">
        <AdminUiButton to="/admin" variant="icon" title="一覧へ戻る">
          <Icon name="lucide:arrow-left" class="size-5" />
        </AdminUiButton>
        <h1 class="text-xl font-bold">画像の管理</h1>
        <span class="text-xs text-fg-muted">
          {{ images.length }}件 · {{ formatSize(totalSize) }}
        </span>
        <AdminUiButton
          variant="primary"
          class="ml-auto"
          :disabled="uploadingCount > 0"
          @click="fileInput?.click()"
        >
          {{ uploadingCount > 0 ? 'アップロード中…' : 'アップロード' }}
        </AdminUiButton>
      </header>

      <!-- ツールバー -->
      <div class="mb-6 flex flex-wrap items-center gap-2">
        <div class="relative">
          <Icon
            name="lucide:search"
            class="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted"
          />
          <input
            v-model="search"
            placeholder="キーで検索"
            class="h-8 w-64 rounded-md border border-solid border-border-subtle bg-surface pl-8 pr-2 text-xs outline-none transition-colors focus:border-fg"
          />
        </div>
        <select
          v-model="sortKey"
          class="h-8 cursor-pointer rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none"
        >
          <option value="uploaded-desc">新しい順</option>
          <option value="uploaded-asc">古い順</option>
          <option value="size-desc">サイズが大きい順</option>
        </select>

        <!-- 期間フィルタ -->
        <div class="flex items-center gap-1.5 text-xs text-fg-muted">
          <input
            v-model="dateFrom"
            type="date"
            class="h-8 cursor-pointer rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none"
          />
          〜
          <input
            v-model="dateTo"
            type="date"
            class="h-8 cursor-pointer rounded-md border border-solid border-border-subtle bg-surface px-2 text-xs outline-none"
          />
          <button
            v-if="dateFrom || dateTo"
            type="button"
            class="cursor-pointer border-none bg-transparent p-1 text-xs text-fg-muted transition-colors hover:text-fg"
            title="期間をクリア"
            @click="clearPeriod"
          >
            <Icon name="lucide:x" class="size-3.5" />
          </button>
        </div>
      </div>

      <p v-if="loading" class="py-16 text-center text-sm text-fg-muted">
        読み込み中…
      </p>
      <div
        v-else
        class="rounded-xl border border-dashed transition-colors"
        :class="
          dragging ? 'border-primary bg-surface-muted' : 'border-transparent'
        "
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <p
          v-if="filteredImages.length === 0"
          class="py-16 text-center text-sm text-fg-muted"
        >
          {{
            search || dateFrom || dateTo
              ? '一致する画像がありません'
              : '画像をドラッグ&ドロップで追加できます'
          }}
        </p>
        <div v-else class="space-y-8">
          <section v-for="group in groupedImages" :key="group.label">
            <h2 v-if="group.label" class="mb-3 text-sm font-bold text-fg">
              {{ group.label }}
              <span class="ml-1 text-xs font-normal text-fg-muted"
                >{{ group.images.length }}件</span
              >
            </h2>
            <div
              class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            >
              <button
                v-for="image in group.images"
                :key="image.key"
                type="button"
                class="cursor-pointer overflow-hidden rounded-lg border-2 border-solid bg-surface-muted p-0 transition-colors"
                :class="
                  selectedKey === image.key
                    ? 'border-fg'
                    : 'border-transparent hover:border-border-subtle'
                "
                @click="select(image)"
              >
                <div class="relative aspect-square">
                  <img
                    :src="image.url"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    class="absolute inset-0 size-full object-cover"
                  />
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        multiple
        class="hidden"
        @change="onFileSelected"
      />
    </div>

    <!-- 詳細パネル(モバイルはオーバーレイ) -->
    <div
      v-if="selectedKey"
      class="fixed inset-0 z-20 bg-black/30 lg:hidden"
      @click="closeDetail"
    />
    <div
      v-if="selectedKey"
      class="fixed inset-y-0 right-0 z-30 w-80 max-w-[85vw] lg:static lg:z-auto lg:max-w-none lg:shrink-0"
    >
      <aside
        class="flex h-full flex-col gap-5 overflow-y-auto border-l border-border-subtle bg-surface p-5 lg:sticky lg:top-0 lg:h-screen"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold">詳細</h2>
          <AdminUiButton
            variant="icon"
            class="!size-8"
            title="閉じる"
            @click="closeDetail"
          >
            <Icon name="lucide:x" class="size-4" />
          </AdminUiButton>
        </div>

        <p v-if="loadingDetail" class="py-8 text-center text-xs text-fg-muted">
          読み込み中…
        </p>
        <template v-else-if="detail">
          <img
            :src="detail.url"
            alt=""
            class="w-full rounded-lg border border-solid border-border-subtle bg-surface-muted"
            @load="onPreviewLoad"
          />

          <dl class="space-y-2 text-xs">
            <div class="flex justify-between gap-3">
              <dt class="shrink-0 text-fg-muted">キー</dt>
              <dd class="truncate font-mono">{{ detail.key }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-fg-muted">形式</dt>
              <dd class="font-mono">{{ detail.contentType ?? '不明' }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-fg-muted">サイズ</dt>
              <dd>{{ formatSize(detail.size) }}</dd>
            </div>
            <div v-if="dimensions" class="flex justify-between gap-3">
              <dt class="text-fg-muted">寸法</dt>
              <dd>{{ dimensions.width }} × {{ dimensions.height }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-fg-muted">アップロード</dt>
              <dd>{{ formatDateTime(detail.uploaded) }}</dd>
            </div>
          </dl>

          <section>
            <h3 class="mb-2 text-xs font-bold text-fg-muted">使用中の記事</h3>
            <p v-if="detail.usedBy.length === 0" class="text-xs text-fg-muted">
              使用されていません
            </p>
            <ul v-else class="space-y-1">
              <li v-for="article in detail.usedBy" :key="article.id">
                <NuxtLink
                  :to="`/admin/edit/${article.id}`"
                  class="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-fg transition-colors hover:bg-surface-muted"
                >
                  <span class="truncate">{{ article.title || '無題' }}</span>
                  <span
                    v-if="article.status !== 'published'"
                    class="shrink-0 rounded bg-surface-muted px-1 py-0.5 text-[10px] text-fg-muted"
                  >
                    {{ article.status === 'draft' ? '下書き' : '非公開' }}
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </section>

          <div class="mt-auto space-y-2 border-t border-border-subtle pt-4">
            <button
              type="button"
              class="block cursor-pointer border-none bg-transparent p-0 text-sm text-fg-muted transition-colors hover:text-fg"
              @click="copyUrl(detail)"
            >
              URLをコピー
            </button>
            <button
              type="button"
              class="block cursor-pointer border-none bg-transparent p-0 text-sm transition-colors"
              :class="
                detail.usedBy.length > 0
                  ? 'cursor-default text-fg-muted/50'
                  : 'text-fg-muted hover:text-red-500'
              "
              :disabled="detail.usedBy.length > 0"
              @click="deleteDialogOpen = true"
            >
              {{
                detail.usedBy.length > 0 ? '使用中のため削除不可' : '画像を削除'
              }}
            </button>
          </div>
        </template>
      </aside>
    </div>

    <AdminUiConfirmDialog
      v-model:open="deleteDialogOpen"
      title="画像を削除しますか？"
      description="この操作は取り消せません。"
      confirm-label="削除する"
      @confirm="deleteImage"
    />
  </div>
</template>
