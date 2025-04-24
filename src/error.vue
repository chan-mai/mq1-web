<script setup lang="ts">
import type { NuxtError } from '#app'

type ErrorProps = {
  error: NuxtError
}

const props = defineProps<ErrorProps>()

const config = useWebConfig()
const route = useRoute()

const title = computed(() =>
  props.error.statusCode === 404
    ? 'ページが見つかりませんでした'
    : `${props.error.statusCode}`,
)
const description = computed(() =>
  props.error.statusCode === 404
    ? 'ページが見つかりませんでした。お探しのページは、URLが変更もしくは削除された可能性があります。お手数ですが、念の為入力されたURLに間違いがないかお確かめください。'
    : props.error.message,
)

useHead(() => ({
  title: title.value,
  meta: [{ name: 'description', content: description.value }]
}))
</script>

<template>
  <div class="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-100">
    <NuxtLoadingIndicator :height="2" :color="config.themeColor" />
    <SiteHeader />
    <main class="relative z-0 mx-auto box-content flex min-h-[calc(100vh-30rem)] flex-col px-6 mt-12 max-w-5xl gap-8 md:mt-20 md:gap-16">
      <PageHeader :title="title">
        <div class="flex gap-2 text-xs">
          <span class="shrink-0 py-1">現在のURL：</span>
          <div class="break-all rounded bg-slate-100 px-2 py-1 font-mono dark:bg-slate-800">
            {{ route.fullPath }}
          </div>
        </div>
      </PageHeader>
      <div class="flex flex-col items-start gap-8">
        <p class="text-sm leading-relaxed">{{ description }}</p>
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-xs">トップページへ戻る</span>
          <Icon name="mingcute:back-fill" class="mt-0.5 size-4" />
        </NuxtLink>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>
