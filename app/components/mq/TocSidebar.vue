<script setup lang="ts">
interface TocItem {
  id: string
  text: string
  level: number
}

const props = defineProps<{
  items: TocItem[],
  articleContent: string,
  pageTitle?: string,
  updatedAt?: string,
  charCount?: number,
  position?: 'top' | 'bottom'
}>()

const tocVisible = ref(false)
const scrollProgress = ref(0)
const currentHeading = ref("")
const activeIndex = ref(0)

const internalExternalCounts = ref({ internal: 0, external: 0 })

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToBottom() {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
}

function scrollToSection(id: string, index: number) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeIndex.value = index
  }
}

function getProgressBar() {
  const total = 6
  const filled = Math.floor((scrollProgress.value / 100) * total)
  return '#'.repeat(filled) + '-'.repeat(total - filled)
}

const formattedUpdatedAt = computed(() => {
  if (!props.updatedAt) return ''
  try {
    const d = new Date(props.updatedAt)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`
  } catch {
    return String(props.updatedAt)
  }
})

onMounted(() => {
  const handleScroll = () => {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY
    const scrollableHeight = documentHeight - windowHeight
    const progress = scrollableHeight > 0 ? Math.round((scrollTop / scrollableHeight) * 100) : 0
    scrollProgress.value = progress

    const headings = props.items.map(item => document.getElementById(item.id))
    for (let i = headings.length - 1; i >= 0; i--) {
      const heading = headings[i]
      if (heading && heading.getBoundingClientRect().top <= 100) {
        activeIndex.value = i
        currentHeading.value = props.items[i]?.text || ''
        break
      }
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()

  // リンク数の算出（記事本文内）
  try {
    const anchors = Array.from(new DOMParser().parseFromString(props.articleContent, 'text/html').querySelectorAll('a')) as HTMLAnchorElement[]
    const { hostname } = window.location
    let internal = 0
    let external = 0
    anchors.forEach(a => {
      const href = a.getAttribute('href') || ''
      try {
        if (href.startsWith('#') || href.trim() === '') return
        const url = href.startsWith('http') ? new URL(href) : new URL(href, window.location.origin)
        if (url.hostname === hostname || href.startsWith('/')) internal++
        else external++
      } catch {
        // 無効なURLはスキップ
      }
    })
    internalExternalCounts.value = { internal, external }
  } catch {
    internalExternalCounts.value = { internal: 0, external: 0 }
  }

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll as EventListener)
  })
})
</script>

<template>
  <aside class="fixed left-0 top-0 bottom-0 z-50 hidden md:flex flex-col items-center">
    <div class="fixed inset-y-0 left-0 w-10 bg-black z-40 pointer-events-none"></div>
    <div class="fixed left-0 top-20 z-50 flex flex-col items-center gap-1 text-white w-10 py-1">
      <button
        class="w-7 h-7 flex items-center justify-center hover:bg-white/10 transition font-mono text-[11px] text-white"
        title="ページ上部へ"
        aria-label="ページ上部へスクロール"
        @click="scrollToTop"
      >
        <span class="block rotate-90 font-semibold text-white">&lt;</span>
      </button>
      <button
        class="w-7 h-7 flex items-center justify-center hover:bg-white/10 transition font-mono text-[11px] text-white"
        title="ページ下部へ"
        aria-label="ページ下部へスクロール"
        @click="scrollToBottom"
      >
        <span class="block rotate-90 font-semibold text-white">&gt;</span>
      </button>
      <button
        class="w-7 h-7 flex items-center justify-center hover:bg-white/10 transition font-mono text-[11px] text-white"
        title="目次表示切り替え"
        aria-label="目次表示切り替え"
        @click="tocVisible = !tocVisible"
      >
        <span class="block font-semibold text-white">≡</span>
      </button>
    </div>

    <div
      v-show="tocVisible"
      class="fixed left-12 top-20 z-50 w-72 max-h-[65vh] overflow-auto border border-black/30 bg-white p-1.5 font-mono text-[12px] leading-snug"
    >
      <div class="flex items-center justify-between border-b border-dotted border-gray-400 pb-1 mb-1 px-1">
        <span class="font-semibold text-[12px] tracking-tight">目次</span>
        <button
          class="px-1.5 py-0.5 text-[12px] hover:bg-gray-100 border border-black/20"
          title="目次を閉じる"
          aria-label="目次を閉じる"
          @click="tocVisible = false"
        >
          ×
        </button>
      </div>
      <div class="flex flex-col divide-y divide-dotted divide-gray-300">
        <button
          v-for="(item, index) in items"
          :key="item.id"
          class="group flex items-start gap-1.5 text-left px-1.5 py-1 hover:bg-gray-50"
          :class="{ 'font-semibold border-l-2 border-black pl-1.5': activeIndex === index }"
          :style="{ paddingLeft: `${(item.level - 1) * 10}px` }"
          @click="scrollToSection(item.id, index)"
        >
          <span class="opacity-80 select-none">・</span>
          <span class="truncate group-hover:underline">{{ item.text }}</span>
        </button>
      </div>
    </div>

    <div class="fixed left-[20px] bottom-[20px] z-50 rotate-[-90deg] origin-left bg-black text-white px-1 py-1 text-[6.5px] leading-tight tracking-tight font-mono w-[400px] h-10 overflow-hidden">
      <div class="flex items-start h-full">
        <div class="flex-1 flex flex-col justify-center gap-0.5 pr-1 border-r border-dotted border-white/40 mr-1">
          <div class="flex gap-0.5"><span class="font-semibold flex-shrink-0">▓▓スクロール :</span><span class="flex-1 min-w-0 truncate">{{ String(scrollProgress).padStart(3, '0') }}%: [{{ getProgressBar() }}]</span></div>
          <div class="flex gap-0.5"><span class="font-semibold flex-shrink-0">▓▓見出しと文字数 :</span><span class="flex-1 min-w-0 truncate">{{ items.length }}個 | {{ (charCount || 0).toLocaleString() }}字</span></div>
          <div class="flex gap-0.5"><span class="font-semibold flex-shrink-0">▓▓リンク数 :</span><span class="flex-1 min-w-0 truncate">内部: {{ internalExternalCounts.internal }} | 外部: {{ internalExternalCounts.external }}</span></div>
        </div>
        <div class="flex-1 flex flex-col justify-center gap-0.5 pl-1">
          <div class="flex gap-0.5"><span class="font-semibold flex-shrink-0">▓▓ページタイトル :</span><span class="flex-1 min-w-0 truncate" :title="pageTitle">{{ pageTitle }}</span></div>
          <div class="flex gap-0.5"><span class="font-semibold flex-shrink-0">▓▓最終更新日 :</span><span class="flex-1 min-w-0 truncate">{{ formattedUpdatedAt }}</span></div>
          <div class="flex gap-0.5" :style="{ opacity: currentHeading ? 1 : 0 }">
            <span class="font-semibold flex-shrink-0">▓▓現在 :</span>
            <span class="flex-1 min-w-0 truncate" :title="currentHeading">{{ currentHeading.slice(0, 20) }}...</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
  
</template>

<style scoped>
</style>


