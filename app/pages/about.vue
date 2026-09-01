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
</script>

<template>
  <main class="max-w-none h-full text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0">
    <div class="min-h-screen overflow-hidden">
      <div class="bg-primary text-white relative w-full max-w-none overflow-hidden md:overflow-visible dot-overlay">
        <div
          class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none bg-[url(/images/about/bg.png)] bg-cover opacity-90 contrast-110" />
        <AboutHeadBackground />

        <!-- 右側のエッジ文字 -->
        <div class="absolute bottom-0 z-20 w-full h-2/3 pointer-events-none">
          <NuxtImg src="/images/about/mai-bg-text.png" format="webp" alt="Mai Sudachi" fetchpriority="high"
            class="w-full h-full object-contain object-right" loading="eager" />
        </div>

        <div class="w-full px-8 pt-[180px] md:pt-[200px] pb-8 max-w-6xl mx-auto relative z-30">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- ヘッダ 情報 -->
            <div class="z-30 relative">
              <div class="mb-32">
                <p class="mobile-text-outline text-sm md:text-base font-light mb-2">
                  応用睡眠技術者
                </p>
                <div class="w-16 h-0.5 bg-white mb-4"></div>
                <h1 class="mobile-text-outline text-5xl md:text-6xl font-bold mb-2">
                  月出里 まい
                </h1>
                <p class="mobile-text-outline text-sm tracking-widest mb-16">
                  SUDACHI MAI
                </p>

                <!-- Socials -->
                <div class="grid grid-cols-1 space-y-2 mb-8 relative z-30">
                  <NuxtLink v-for="social in socials.filter((s) => s.isFixed)" :key="social.name" :to="social.url"
                    target="_blank" rel="me"
                    class="w-1/3 bg-white/80 text-accent rounded-full px-3 py-2 hover:bg-primary/90 hover:text-white transition-all flex items-center">
                    <Icon :name="social.icon" class="mr-2 size-5" />
                    <span class="text-sm">{{ social.name }}</span>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="absolute w-full h-full left-0 pointer-events-none">
          <!-- 背景画像 -->
          <div class="absolute top-0 z-20 w-full h-full opacity-30 -translate-y-full contrast-120 overflow-hidden">
            <NuxtImg src="/images/about/mai-bg.png" format="webp" alt="doted mai" fetchpriority="high"
              class="w-full h-full object-cover object-center pointer-events-none" loading="eager" />
          </div>

          <!-- 立ち絵 -->
          <div
            class="absolute w-full top-0 z-20 -translate-y-[75%] md:-translate-y-2/3 scale-80 md:scale-100 -right-0 md:right-[15%]">
            <div
              class="character-glow absolute w-full h-full top-0 right-0 z-40 bg-white/10 blur-3xl rounded-full transform scale-150">
            </div>
            <NuxtImg src="/images/about/mai.png" format="webp" alt="Mai Sudachi" fetchpriority="high"
              class="object-contain max-h-[800px] relative z-[60] ml-auto character-shadow" loading="eager"
              decoding="async" />
          </div>
        </div>
      </div>

      <!-- ループテキスト -->
      <div class="w-full bg-surface-elevated border-t-2 border-b-2 border-accent overflow-hidden py-1">
        <div class="flex whitespace-nowrap">
          <div v-for="i in 30" :key="i" class="animate-marquee flex gap-12 items-center pr-12 select-none shrink-0">
            <span class="text-xs font-semibold tracking-tighter text-accent">SUDACHI MAI</span>
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
              <p class="text-xs font-semibold tracking-widest uppercase text-accent/70">
                私について
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
            <h2
              class="font-accent text-4xl font-bold tracking-tighter text-accent/80 uppercase select-none lg:text-6xl">
              Introduction
            </h2>
          </div>
        </div>
      </div>

      <!-- 以下下部セクション -->
      <div class="relative w-full overflow-hidden">

        <div class="relative mx-auto max-w-7xl px-6 py-14 md:py-20 space-y-16 md:space-y-20">
          <!-- 挨拶 + メタ情報 -->
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div class="lg:col-span-7">
              <p class="mb-6 text-2xl leading-none md:text-3xl xl:text-4xl text-primary font-semibold">
                Hello, I'm
                <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">chan-mai</span>
                <span class="waving-hand">👋🏻</span>
              </p>
              <p class="text-base leading-[2.2] text-fg-muted font-light tracking-wide text-justify">
                九州を根城に生息している、ひとのふりをしたITなんでも屋さん。<br />
                たまにクリエイティブなことにも手を出します。<br />
                以後お見知りおきを。
              </p>
            </div>

            <aside class="lg:col-span-5 rounded-xl border border-border-subtle bg-surface-elevated p-6 space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs font-semibold tracking-widest uppercase text-fg-muted mb-1">
                    Role
                  </p>
                  <p class="text-lg">Engineer?</p>
                </div>
                <div>
                  <p class="text-xs font-semibold tracking-widest uppercase text-fg-muted mb-1">
                    Character Design
                  </p>
                  <NuxtLink to="https://x.com/CSea2073" target="_blank"
                    class="text-lg hover:text-primary transition-colors">Aya Fukanaki</NuxtLink>
                </div>
              </div>

              <div class="border-t border-border-subtle" />

              <div>
                <p class="text-xs font-semibold tracking-widest uppercase text-fg-muted mb-3">
                  Socials
                </p>
                <div class="flex flex-wrap gap-2">
                  <div v-for="social in socials" :key="social.name">
                    <MqAppLink class="text-xs" :to="social.url" rel="me noopener noreferrer">
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

          <!-- Profile -->
          <section>
            <p class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-fg-muted">
              <Icon name="lucide:user-round" class="h-3.5 w-3.5" />
              Profile
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-12 border-t border-dotted border-border-subtle">
              <dl v-for="item in [
                { label: '誕生日', value: '2006/04/04' },
                { label: '星 座', value: 'おひつじ座' },
                { label: '生息地', value: '九州' },
                { label: '好きなもの', value: 'インターネット' },
                { label: '言語', value: 'Go / Dart' },
              ]" :key="item.label" class="flex items-baseline py-4 border-b border-dotted border-border-subtle">
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
            <p class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-fg-muted">
              <Icon name="lucide:camera" class="h-3.5 w-3.5" />
              Snapshots
            </p>
            <div class="snapshot-scroll flex gap-4 overflow-x-auto pb-2">
              <div v-for="i in 5" :key="i"
                class="w-[200px] h-[112px] bg-surface-muted border border-border-subtle rounded-xl overflow-hidden relative flex-shrink-0 group cursor-pointer transition-transform hover:scale-[1.02]">
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div class="w-10 h-10 rounded-full bg-surface-elevated/80 flex items-center justify-center">
                    <Icon name="ph:play-fill" class="w-4 h-4 text-primary/80 ml-0.5" />
                  </div>
                  <span class="text-xs font-semibold tracking-tighter text-primary">COMING SOON...</span>
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

.dot-overlay::after {
  content: '';
  position: absolute;
  z-index: 10;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEElEQVR4nGP4//9/GgNlAADe/gNkBNkWTgAAAABJRU5ErkJggg==) repeat;
  background-color: rgba(0, 0, 0, 0.1);
  background-color: rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

/* 立ち絵の影: 近い順に濃いピンク → 遠いほど薄くなる */
.character-shadow {
  filter: drop-shadow(5px -3px 0 #ff8fb0) drop-shadow(10px -5px 0 #ffcada) drop-shadow(17px -9px 0 #ffe3ed);
}

.mobile-text-outline {
  color: #fff;
  -webkit-text-stroke: 2px #ff759c;
  text-stroke: 2px #ff759c;
  paint-order: stroke fill;
}

@media (min-width: 768px) {
  .mobile-text-outline {
    -webkit-text-stroke: 0;
    text-stroke: 0;
  }
}
</style>
