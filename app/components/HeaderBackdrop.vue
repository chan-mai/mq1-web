<script setup lang="ts">
type Bezier = readonly [number, number, number, number];

// マスク階調サンプリング位置
const positions = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
// ぼかしレイヤ半径, マスク指数
const blurSpecs = [
  { radius: 0.18, exponent: 0.7 },
  { radius: 0.45, exponent: 0.95 },
  { radius: 0.89, exponent: 1.25 },
  { radius: 1.61, exponent: 1.6 },
  { radius: 2.14, exponent: 2 },
  { radius: 2.5, exponent: 2.5 },
];
const saturation = 0.666;
const blurBezier: Bezier = [0.5, 0, 0.75, 1];
const desatBezier: Bezier = [0.5, 0, 0.75, 1];
const transitionDuration = 320;

const cubicCoordinate = (t: number, first: number, second: number) => {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * t * first + 3 * inverse * t * t * second + t * t * t
  );
};

// x座標から3次ベジェyを二分探索
const easingAt = (x: number, bezier: Bezier) => {
  const [x1, y1, x2, y2] = bezier;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i += 1) {
    const middle = (low + high) / 2;
    if (cubicCoordinate(middle, x1, x2) < x) low = middle;
    else high = middle;
  }
  return cubicCoordinate((low + high) / 2, y1, y2);
};

// 上端最大, 下端で0に減衰 縦グラデーション
const maskForBezier = (bezier: Bezier, exponent: number) =>
  'linear-gradient(to bottom, ' +
  positions
    .map((position) => {
      const alpha = (1 - easingAt(position / 100, bezier)) ** exponent;
      return `rgba(0, 0, 0, ${alpha.toFixed(4)}) ${position}%`;
    })
    .join(', ') +
  ')';

// 描画順は彩度低下が先, ぼかしを半径昇順重ねrう
const layers = [
  {
    mask: maskForBezier(desatBezier, 1),
    idleFilter: 'saturate(1)',
    activeFilter: `saturate(${saturation})`,
  },
  ...blurSpecs.map((spec) => ({
    mask: maskForBezier(blurBezier, spec.exponent),
    idleFilter: 'blur(0px)',
    activeFilter: `blur(${spec.radius}px)`,
  })),
];

const { y } = useWindowScroll();
const active = computed(() => y.value > 0);
</script>

<template>
  <Transition :duration="transitionDuration">
    <div v-if="active" class="header-backdrop" aria-hidden="true">
      <div v-for="(layer, index) in layers" :key="index" class="header-backdrop-layer" :style="{
        maskImage: layer.mask,
        WebkitMaskImage: layer.mask,
        '--idle-filter': layer.idleFilter,
        '--active-filter': layer.activeFilter,
      }"></div>
    </div>
  </Transition>
</template>

<style scoped>
.header-backdrop {
  position: fixed;
  inset: 0 0 auto 0;
  height: clamp(112px, 16vw, 184px);
  z-index: 5;
  overflow: hidden;
  pointer-events: none;
}

.header-backdrop-layer {
  position: absolute;
  inset: 0;
  backdrop-filter: var(--active-filter);
  -webkit-backdrop-filter: var(--active-filter);
  transition-property:
    backdrop-filter,
    -webkit-backdrop-filter;
  transition-duration: v-bind("transitionDuration + 'ms'");
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

/* 挿入前と除去中はフィルタ無効 */
.v-enter-from .header-backdrop-layer,
.v-leave-to .header-backdrop-layer {
  backdrop-filter: var(--idle-filter);
  -webkit-backdrop-filter: var(--idle-filter);
}
</style>
