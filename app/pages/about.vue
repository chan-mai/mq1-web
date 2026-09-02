<script setup lang="ts">
definePageMeta({ headerInverse: true });

const config = useWebConfig();
const socials = Object.values(config.value.socials);

useHead({
  title: `私について - ${config.value.siteName}`,
  meta: [
    { name: 'description', content: config.value.siteDescription },
    { property: 'og:site_name', content: config.value.siteName },
    { property: 'og:title', content: `${config.value.siteName} - 私について` },
    { property: 'og:description', content: config.value.siteDescription },
    {
      property: 'og:image',
      content: `${config.value.siteUrl}images/ogp/about-ogp.png`,
    },
    { property: 'og:url', content: `${config.value.siteUrl}about` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    {
      name: 'twitter:image',
      content: `${config.value.siteUrl}images/ogp/about-ogp.png`,
    },
  ],
});

// 構造化データ (JSON-LD)
useJsonld([
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: config.value.author.name,
    alternateName: config.value.author.name,
    givenName: config.value.author.name,
    familyName: config.value.author.name,
    birthDate: config.value.author.birthDate,
    jobTitle: config.value.author.jobTitle,
    description: config.value.author.description,
    url: config.value.siteUrl,
    image: `${config.value.siteUrl}images/about/mai.png`,
    sameAs: socials.filter((social) => social.url).map((social) => social.url),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.value.siteName,
    description: config.value.siteDescription,
    url: config.value.siteUrl,
    author: {
      '@type': 'Person',
      name: config.value.author.name,
      url: config.value.siteUrl,
    },
  },
]);

// Heroのカーソル追従レンズ
const heroEl = ref<HTMLElement | null>(null);
const heroLens = ref<HTMLElement | null>(null);
const lensEnabled = ref(false);
let lensRaf = 0;
const lensState = { x: 0, y: 0, r: 0 };
const applyLens = () => {
  lensRaf = 0;
  if (heroLens.value)
    heroLens.value.style.clipPath = `circle(${lensState.r}px at ${lensState.x}px ${lensState.y}px)`;
};
const onHeroMove = (e: MouseEvent) => {
  if (!lensEnabled.value || !heroEl.value) return;
  // リンク上レンズ退避
  if ((e.target as HTMLElement).closest('a')) {
    onHeroLeave();
    return;
  }
  const rect = heroEl.value.getBoundingClientRect();
  lensState.x = e.clientX - rect.left;
  lensState.y = e.clientY - rect.top;
  lensState.r = 120;
  if (!lensRaf) lensRaf = requestAnimationFrame(applyLens);
};
const onHeroLeave = () => {
  lensState.r = 0;
  if (!lensRaf) lensRaf = requestAnimationFrame(applyLens);
};
onMounted(() => {
  lensEnabled.value = window.matchMedia('(pointer: fine)').matches;
});
onUnmounted(() => {
  if (lensRaf) cancelAnimationFrame(lensRaf);
});

// スクロール出現演出
const aboutRoot = ref<HTMLElement | null>(null);
useRevealAnimations(aboutRoot);
</script>

<template>
  <main ref="aboutRoot"
    class="max-w-none h-full text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0">
    <div class="min-h-screen overflow-x-clip">
      <div ref="heroEl" class="bg-primary text-white relative w-full max-w-none overflow-hidden md:overflow-visible"
        @mousemove="onHeroMove" @mouseleave="onHeroLeave">
        <AboutHeroVisual />

        <!-- カーソル追従の拡大レンズ -->
        <div v-if="lensEnabled" ref="heroLens" class="hero-lens" aria-hidden="true" inert>
          <div class="hero-lens-view">
            <AboutHeroVisual lens />
          </div>
        </div>
      </div>

      <!-- ループテキスト -->
      <div class="w-full bg-surface-elevated border-t-2 border-b-2 border-accent overflow-hidden py-1">
        <div class="flex whitespace-nowrap">
          <div v-for="i in 30" :key="i" class="animate-marquee flex gap-12 items-center pr-12 select-none shrink-0">
            <span class="font-futura text-xs font-semibold tracking-tighter text-accent">SUDACHI MAI</span>
            <Icon name="ph:star-four-fill" class="size-3 text-primary" />
          </div>
        </div>
      </div>

      <!-- Introductionバンド 立ち絵足元の受け -->
      <div class="relative w-full overflow-hidden bg-[#f2e6e7] dark:bg-primary/5">
        <!-- ドットパターン -->
        <div
          class="absolute inset-0 bg-[radial-gradient(rgba(245,122,165,0.22)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"
          aria-hidden="true"></div>

        <!-- エッジ装飾 対角線入り四角の縦列 -->
        <div
          class="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col items-center gap-2 pointer-events-none"
          aria-hidden="true">
          <svg v-for="(tone, i) in [
            'text-accent/60',
            'text-accent/45',
            'text-accent/30',
            'text-accent/20',
          ]" :key="i" :class="tone" class="size-4" viewBox="0 0 12 12" fill="none" stroke="currentColor"
            stroke-width="1">
            <rect x="0.5" y="0.5" width="11" height="11" />
            <line x1="0.5" y1="11.5" x2="11.5" y2="0.5" />
          </svg>
        </div>

        <!-- スパークル -->
        <Icon name="ph:star-four-fill" class="absolute left-[10%] top-[24%] size-4 text-primary/50 pointer-events-none"
          aria-hidden="true" />
        <Icon name="ph:star-four-fill"
          class="absolute left-[42%] bottom-[20%] size-3 text-accent/40 pointer-events-none" aria-hidden="true" />
        <Icon name="ph:star-four-fill"
          class="hidden md:block absolute right-[8%] top-[32%] size-6 text-primary/40 pointer-events-none"
          aria-hidden="true" />

        <div class="relative mx-auto flex max-w-7xl items-end px-6 py-8 md:min-h-[260px] md:py-0">
          <div class="w-fit md:pb-8">
            <div class="mb-1 md:mb-2 flex items-center justify-between">
              <p data-fill-in class="w-fit text-xs font-semibold tracking-widest uppercase text-accent/70">
                <span>私について</span>
              </p>
              <!-- 対角線入り四角 -->
              <div class="flex items-center gap-1.5" aria-hidden="true">
                <svg v-for="(tone, i) in [
                  'text-accent/70',
                  'text-accent/50',
                  'text-accent/30',
                ]" :key="i" :class="tone" class="size-3" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                  stroke-width="1">
                  <rect x="0.5" y="0.5" width="11" height="11" />
                  <line x1="0.5" y1="11.5" x2="11.5" y2="0.5" />
                </svg>
              </div>
            </div>
            <h2 data-fill-in
              class="w-fit text-4xl font-bold tracking-tighter text-accent/80 uppercase select-none lg:text-6xl">
              <span>Introduction</span>
            </h2>
          </div>
        </div>
      </div>

      <!-- 以下下部セクション -->
      <div class="relative w-full overflow-x-clip">
        <div class="relative mx-auto max-w-7xl px-6 py-14 md:py-20 space-y-16 md:space-y-20">
          <!-- 挨拶 + メタ情報 -->
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div class="lg:col-span-7">
              <p data-fade-in class="font-futura mb-6 text-2xl leading-none md:text-3xl xl:text-4xl font-semibold">
                <span>Hello, I'm
                  <span class="highlight-with-image">chan-mai</span>
                  <span class="waving-hand">👋🏻</span></span>
              </p>
              <p class="text-base leading-[2.2] text-fg-muted font-light tracking-wide text-justify">
                <span data-fade-in class="block">九州を根城に生息している、ひとのふりをしたITなんでも屋さん。</span>
                <span data-fade-in data-fade-delay="0.1" class="block">たまにクリエイティブなことにも手を出します。</span>
                <span data-fade-in data-fade-delay="0.2" class="block">以後お見知りおきを。</span>
              </p>
            </div>

            <aside data-fade-in class="lg:col-span-5 rounded-xl bg-surface-elevated p-6 space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="font-futura text-xs font-semibold tracking-widest uppercase text-fg-muted mb-1">
                    Role
                  </p>
                  <p class="text-lg">Engineer?</p>
                </div>
                <div>
                  <p class="font-futura text-xs font-semibold tracking-widest uppercase text-fg-muted mb-1">
                    Character Design
                  </p>
                  <NuxtLink to="https://x.com/CSea2073" target="_blank"
                    class="text-lg hover:text-primary transition-colors">Aya Fukanaki</NuxtLink>
                </div>
              </div>

              <div class="border-t border-border-subtle" />

              <div>
                <p class="font-futura text-xs font-semibold tracking-widest uppercase text-fg-muted mb-3">
                  Socials
                </p>
                <div class="flex flex-wrap gap-2">
                  <div v-for="social in socials" :key="social.name">
                    <MqAppLink class="text-xs" :to="social.url" :fill="social.color" rel="me noopener noreferrer">
                      {{ social.name }}
                      <template #icon>
                        <Icon :name="social.icon" class="size-3" />
                      </template>
                    </MqAppLink>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <AboutInterlude />

          <AboutThingsIMake class="!mt-0" />

          <!-- Profile -->
          <section>
            <p data-fill-in
              class="font-futura mb-4 flex w-fit items-center gap-2 text-xs font-semibold tracking-widest uppercase text-fg-muted">
              <Icon name="lucide:user-round" class="h-3.5 w-3.5" />
              <span>Profile</span>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-12 border-t border-dotted border-border-subtle">
              <dl v-for="(item, i) in [
                { label: '誕生日', value: '2006/04/04' },
                { label: '星 座', value: 'おひつじ座' },
                { label: '生息地', value: '九州' },
                { label: '好きなもの', value: 'インターネット' },
                { label: '言語', value: 'Go / Dart' },
              ]" :key="item.label" data-fade-in :data-fade-delay="i * 0.08"
                class="flex items-baseline py-4 border-b border-dotted border-border-subtle">
                <dt class="w-[110px] shrink-0 text-base text-fg-muted font-light tracking-wide">
                  {{ item.label }}
                </dt>
                <dd class="flex-1 text-base font-medium">
                  {{ item.value }}
                </dd>
              </dl>
            </div>
          </section>

          <!-- Snapshots -->
          <section>
            <p data-fill-in
              class="font-futura mb-4 flex w-fit items-center gap-2 text-xs font-semibold tracking-widest uppercase text-fg-muted">
              <Icon name="lucide:camera" class="h-3.5 w-3.5" />
              <span>Snapshots</span>
            </p>
            <div data-fade-in class="snapshot-scroll flex gap-4 overflow-x-auto pb-2">
              <div v-for="i in 5" :key="i"
                class="w-[200px] h-[112px] bg-surface-muted rounded-xl overflow-hidden relative flex-shrink-0 group cursor-pointer transition-transform hover:scale-[1.02]">
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div class="w-10 h-10 rounded-full bg-surface-elevated/80 flex items-center justify-center">
                    <Icon name="ph:play-fill" class="w-4 h-4 text-primary/80 ml-0.5" />
                  </div>
                  <span class="font-futura text-xs font-semibold tracking-tighter text-primary">COMING SOON...</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.animate-marquee {
  animation: marquee 30s linear infinite;
}

.snapshot-scroll {
  scrollbar-width: none;
}

.snapshot-scroll::-webkit-scrollbar {
  display: none;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-100%);
  }
}

/* カーソル追従レンズ */
.hero-lens {
  position: absolute;
  inset: 0;
  z-index: 70;
  overflow: hidden;
  pointer-events: none;
  clip-path: circle(0px at 50% 50%);
  transition: clip-path 0.18s ease-out;
}

.hero-lens-view {
  height: 100%;
  transform: scale(1.25);
  transform-origin: 50% 50%;
}
</style>
