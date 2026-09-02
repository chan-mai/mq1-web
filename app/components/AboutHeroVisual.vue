<script setup lang="ts">
// lens: レンズ複製側のUI要素を非表示
defineProps<{ lens?: boolean }>();

const config = useWebConfig();
const socials = Object.values(config.value.socials);
</script>

<template>
  <div class="dot-overlay relative h-full w-full">
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
            <div v-if="!lens" class="grid grid-cols-1 space-y-2 mb-8 relative z-30">
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
</template>

<style scoped>
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
