<script setup lang="ts">
const config = useWebConfig();

type TimWork = (typeof config.value.works)[number];
const works: TimWork[] = [
  ...config.value.works,
];

const { data: timOgp } = await useAsyncData('tim-ogp', async () => {
  const entries = await Promise.all(
    works
      .filter((work) => !work.image)
      .map(async (work) => {
        const preview = await $fetch<LinkPreviewResponse>('/api/link-preview', {
          query: { url: work.url },
        }).catch(() => null);
        return [work.url, preview?.image] as const;
      }),
  );
  return Object.fromEntries(entries) as Record<string, string | undefined>;
});
const timImage = (work: TimWork) => work.image ?? timOgp.value?.[work.url];

const timSoonCount = 3;
const timItems = [
  ...works.map((work, index) => ({ type: 'work' as const, work, index })),
  ...Array.from({ length: timSoonCount }, (_, offset) => ({
    type: 'soon' as const,
    index: works.length + offset,
  })),
];

const timSection = ref<HTMLElement | null>(null);
let timCleanup: (() => void) | undefined;

onMounted(async () => {
  if (!timSection.value) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  // カードのGSAP演出
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  const { ScrambleTextPlugin } = await import('gsap/ScrambleTextPlugin');
  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);
  const ctx = gsap.context(() => {
    gsap.from('.tim-card', {
      y: 28,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: timSection.value, start: 'top 60%' },
    });
    gsap.from('.tim-line', {
      scaleX: 0,
      duration: 1.1,
      ease: 'power3.inOut',
      stagger: 0.1,
      scrollTrigger: { trigger: '.tim-line', start: 'top 92%' },
    });
    gsap.to('.tim-spark', {
      rotate: 180,
      opacity: 0.3,
      duration: 2.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
    gsap.utils.toArray<HTMLElement>('.tim-soon').forEach((el, idx) => {
      gsap.to(el, {
        duration: 1.1,
        scrambleText: { text: 'COMING SOON', chars: '/=+*-_', speed: 0.3 },
        repeat: -1,
        repeatDelay: 3.6,
        delay: 1.5 + idx * 1.1,
      });
    });
  }, timSection.value);
  timCleanup = () => ctx.revert();
});

onUnmounted(() => timCleanup?.());
</script>

<template>
  <section ref="timSection" class="relative !mt-0">
    <!-- カード一覧 -->
    <div class="relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]">
      <div class="relative w-full overflow-hidden bg-surface-elevated/40">
        <!-- ドットパターン -->
        <div
          class="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(245,122,165,0.22)_1px,transparent_1px)] [background-size:20px_20px]"
          aria-hidden="true"></div>
        <!-- 粒状ノイズ -->
        <div class="tim-grain pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden="true"></div>

        <!-- スパークル -->
        <Icon name="ph:star-four-fill" class="pointer-events-none absolute left-[8%] top-[16%] size-4 text-primary/40"
          aria-hidden="true" />
        <Icon name="ph:star-four-fill"
          class="pointer-events-none absolute bottom-[18%] right-[9%] size-3 text-accent/30" aria-hidden="true" />

        <!-- 見出し -->
        <div class="relative mx-auto w-full max-w-7xl px-6 pt-14 md:pt-16">
          <div class="w-fit">
            <div class="mb-1 md:mb-2 flex items-center justify-between">
              <p data-fill-in class="w-fit text-xs font-semibold tracking-widest uppercase text-accent/70">
                <span>つくったもの</span>
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
              <span>Things I Make</span>
            </h2>
          </div>
        </div>

        <p class="font-futura pointer-events-none absolute right-6 top-4 text-[9px] tracking-[0.25em] text-fg-muted/80"
          aria-hidden="true">
          INDEX / N={{ works.length + timSoonCount }}
        </p>

        <!-- コーナーの対角線入り四角 -->
        <svg v-for="pos in [
          'left-3 top-9',
          'right-3 top-9',
          'bottom-3 left-3',
          'bottom-3 right-3',
        ]" :key="pos" :class="pos" class="pointer-events-none absolute size-3 text-accent/40" viewBox="0 0 12 12"
          fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
          <rect x="0.5" y="0.5" width="11" height="11" />
          <line x1="0.5" y1="11.5" x2="11.5" y2="0.5" />
        </svg>

        <!-- カード列 -->
        <div class="relative mx-auto w-full max-w-7xl px-6 pb-16 md:pb-20">
          <div
            class="mt-12 grid w-full grid-cols-2 items-start justify-items-center gap-x-6 gap-y-12 md:mt-16 md:grid-cols-4 md:gap-10">
            <div v-for="(s, si) in timItems" :key="si" class="tim-card">
              <!-- 作品カード -->
              <div v-if="s.type === 'work'" class="w-full max-w-60">
                <div class="relative">
                  <!-- 縦書きラベル -->
                  <span
                    class="absolute -left-4 top-0 text-[8px] tracking-[0.25em] text-fg-muted/70 [writing-mode:vertical-rl]">
                    No.{{ String(s.index + 1).padStart(2, '0') }} / PUBLIC
                  </span>
                  <!-- 多層オフセット枠 -->
                  <div
                    class="tim-clip absolute inset-0 -translate-y-1.5 translate-x-1.5 border border-accent/30 bg-accent/10"
                    aria-hidden="true"></div>
                  <div
                    class="tim-clip absolute inset-0 -translate-y-[3px] translate-x-[3px] border border-accent/40 bg-accent/20"
                    aria-hidden="true"></div>
                  <!-- 本体 -->
                  <div class="tim-clip relative overflow-hidden border border-border-subtle bg-surface-muted">
                    <NuxtImg v-if="s.work.image" :src="s.work.image" format="webp" :alt="s.work.title"
                      class="aspect-video w-full object-cover" loading="lazy" />
                    <img v-else-if="timImage(s.work)" :src="timImage(s.work)" :alt="s.work.title"
                      class="aspect-video w-full object-cover" loading="lazy" />
                    <div v-else class="aspect-video w-full" aria-hidden="true"></div>
                  </div>
                  <!-- トンボ+コーナードット -->
                  <span class="tim-frame" aria-hidden="true"></span>
                  <span class="absolute -right-1.5 -top-1.5 size-1 rounded-full bg-accent/70" aria-hidden="true"></span>
                  <span class="absolute -bottom-1.5 -left-1.5 size-1 rounded-full bg-accent/70"
                    aria-hidden="true"></span>
                  <!-- 回転シール -->
                  <svg class="tim-seal absolute -bottom-5 -right-4 size-16 text-accent/80" viewBox="0 0 64 64"
                    aria-hidden="true">
                    <defs>
                      <path id="tim-seal-arc" d="M 32 7 a 25 25 0 1 1 -0.01 0" fill="none" />
                    </defs>
                    <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.7" />
                    <circle cx="32" cy="32" r="2" fill="currentColor" opacity="0.8" />
                    <text font-size="6.4" letter-spacing="1.6" fill="currentColor">
                      <textPath href="#tim-seal-arc">
                        THINGS I MAKE + SUDACHI MAI +
                      </textPath>
                    </text>
                  </svg>
                </div>
                <!-- アウトライン数字+タイトル -->
                <div class="relative mt-2.5">
                  <span
                    class="font-futura pointer-events-none absolute -top-2.5 left-0 text-3xl font-bold text-transparent [-webkit-text-stroke:1px_rgba(224,86,127,0.45)]"
                    aria-hidden="true">
                    {{ String(s.index + 1).padStart(2, '0') }}
                  </span>
                  <h3 class="relative pl-8 text-base font-medium tracking-wide">
                    {{ s.work.title }}
                  </h3>
                </div>
                <div class="mt-1 flex items-center gap-1.5" aria-hidden="true">
                  <span class="h-px flex-1 bg-border-subtle"></span>
                  <svg class="size-1.5 text-accent/60" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                    stroke-width="1.4">
                    <rect x="0.5" y="0.5" width="11" height="11" />
                    <line x1="0.5" y1="11.5" x2="11.5" y2="0.5" />
                  </svg>
                </div>
                <p class="mt-1 text-[10px] leading-relaxed text-fg-muted">
                  {{ s.work.description }}
                </p>
                <div v-if="s.work.tags.length" class="mt-1.5 flex flex-wrap gap-1">
                  <span v-for="tag in s.work.tags" :key="tag"
                    class="font-futura rounded-[2px] border border-border-subtle px-1.5 py-0.5 text-[8px] tracking-[0.08em] text-fg-muted">
                    {{ tag }}
                  </span>
                </div>
                <a :href="s.work.url" target="_blank" rel="noopener noreferrer"
                  class="mt-2 inline-block border-b border-fg/60 pb-0.5 text-[9px] tracking-[0.1em] transition-colors hover:border-primary hover:text-primary">
                  みてみる →
                </a>
              </div>

              <!-- 準備中カード -->
              <div v-else class="w-full max-w-60">
                <div class="relative">
                  <span
                    class="absolute -left-4 top-0 text-[8px] tracking-[0.25em] text-fg-muted/50 [writing-mode:vertical-rl]">
                    No.{{ String(s.index + 1).padStart(2, '0') }} / TBA
                  </span>
                  <div
                    class="tim-clip relative flex aspect-video items-center justify-center overflow-hidden border border-dashed border-border-subtle bg-surface-muted/50">
                    <!-- 十字線+二重円 -->
                    <span class="absolute left-0 top-1/2 h-px w-full bg-fg-muted/15" aria-hidden="true"></span>
                    <span class="absolute left-1/2 top-0 h-full w-px bg-fg-muted/15" aria-hidden="true"></span>
                    <span
                      class="absolute left-1/2 top-1/2 aspect-square h-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fg-muted/20"
                      aria-hidden="true"></span>
                    <span
                      class="absolute left-1/2 top-1/2 aspect-square h-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fg-muted/15"
                      aria-hidden="true"></span>
                    <!-- アウトライン番号 -->
                    <span
                      class="font-futura pointer-events-none text-4xl font-bold text-transparent [-webkit-text-stroke:1px_rgba(224,86,127,0.35)]"
                      aria-hidden="true">
                      {{ s.index + 1 }}
                    </span>
                  </div>
                  <span class="tim-frame" aria-hidden="true"></span>
                  <span class="absolute -right-1.5 -top-1.5 size-1 rounded-full bg-fg-muted/40"
                    aria-hidden="true"></span>
                  <span class="absolute -bottom-1.5 -left-1.5 size-1 rounded-full bg-fg-muted/40"
                    aria-hidden="true"></span>
                </div>
                <p class="tim-soon font-futura mt-2 text-center text-[9px] tracking-[0.2em] text-fg-muted/60">
                  COMING SOON
                </p>
              </div>
            </div>
          </div>

          <!-- 結び罫 -->
          <div class="relative mt-14 flex items-center gap-3" aria-hidden="true">
            <span class="tim-line h-px flex-1 origin-left bg-border-subtle"></span>
            <Icon name="ph:star-four-fill" class="tim-spark size-2.5 text-primary/60" />
            <span class="tim-line h-px flex-1 origin-right bg-border-subtle"></span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 切り欠きクリップ 右上/左下 */
.tim-clip {
  clip-path: polygon(0 0,
      calc(100% - 12px) 0,
      100% 12px,
      100% 100%,
      12px 100%,
      0 calc(100% - 12px));
}

/* トンボ 左上/右下 */
.tim-frame {
  position: absolute;
  inset: -7px;
  pointer-events: none;
}

.tim-frame::before,
.tim-frame::after {
  content: '';
  position: absolute;
  width: 13px;
  height: 13px;
}

.tim-frame::before {
  left: 0;
  top: 0;
  border-left: 1px solid rgba(224, 86, 127, 0.4);
  border-top: 1px solid rgba(224, 86, 127, 0.4);
}

.tim-frame::after {
  right: 0;
  bottom: 0;
  border-right: 1px solid rgba(224, 86, 127, 0.4);
  border-bottom: 1px solid rgba(224, 86, 127, 0.4);
}

/* 回転シール */
@media (prefers-reduced-motion: no-preference) {
  .tim-seal {
    animation: tim-spin 26s linear infinite;
  }
}

@keyframes tim-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 粒状ノイズ */
.tim-grain {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 128px 128px;
}
</style>
