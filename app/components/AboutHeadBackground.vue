<script setup lang="ts">
const ZZZ = () => h('div', {
  class: 'zzz-text',
  style: {
    whiteSpace: 'nowrap',
    fontSize: '12rem',
    userSelect: 'none',
    fontWeight: '800',
    letterSpacing: '10px',
    height: 'fit-content',
    lineHeight: '0.95',
    color: 'var(--color-bg-subtle, #f5f5f5)'
  }
}, 'MAI SUDACHI');

const breakpoint = ref('md');
const kiRurasCount = computed(() => {
  switch (breakpoint.value) {
    case 'xs': return 20;
    case 'sm': return 130;
    default: return 500;
  }
});

const zzzs = computed(() => Array(kiRurasCount.value).fill(ZZZ));

const doubleZzzs = computed(() => {
  const result = [];
  const temp = [...zzzs.value];
  for (let i = 0; i < temp.length; i += 4) {
    result.push(temp.slice(i, i + 4));
  }
  return result;
});

const splitZzzs = computed(() => {
  const result = [];
  const temp = [...doubleZzzs.value];
  for (let i = 0; i < temp.length; i += 5) {
    result.push(temp.slice(i, i + 5));
  }
  return result;
});

const updateBreakpoint = () => {
  const width = window.innerWidth;
  if (width < 640) {
    breakpoint.value = 'xs';
  } else if (width < 768) {
    breakpoint.value = 'sm';
  } else {
    breakpoint.value = 'md';
  }
};

onMounted(() => {
  updateBreakpoint();
});

useEventListener('resize', updateBreakpoint);
</script>

<template>
  <ClientOnly>
    <div class="zzz-container" data-header-inverse="true">
      <div class="zzz-bleed"></div>
      <div class="zzz-content">
        <div v-for="(zzzs, i) in splitZzzs" :key="`row-${i}`" class="zzz-row">
          <div 
            v-for="(doubleZzzs, j) in zzzs" 
            :key="`group-${i}-${j}`"
            class="zzz-group"
            :class="`slide-${i % 2 === 0 ? 'left' : 'right'}`"
          >
            <component 
              v-for="(ZZZ, k) in doubleZzzs" 
              :key="`zzz-${i}-${j}-${k}`"
              :is="ZZZ"
            />
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.zzz-container {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  max-width: 100%;
  height: 100%;
  max-height: 75rem;
}

.zzz-bleed {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, transparent, var(--color-accent));
  z-index: 2;
}

.zzz-content {
  transform: rotate(-45deg);
}

@media (max-width: 640px) {
  .zzz-content {
    transform: rotate(-90deg);
  }
}

.zzz-row {
  display: flex;
  flex-direction: row;
}

.zzz-group {
  display: flex;
  flex-direction: row;
}

.zzz-text {
  white-space: nowrap;
  font-size: 12rem;
  user-select: none;
  font-weight: 800;
  letter-spacing: 10px;
  height: fit-content;
  line-height: 0.95;
  color: #fff;
  opacity: 0.1;
}

.slide-left {
  animation: slide-to-left-full 200s linear infinite;
}

.slide-right {
  animation: slide-to-right-full 200s linear infinite;
}

@keyframes slide-to-left-full {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

@keyframes slide-to-right-full {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 640px) {
  .zzz-text {
    font-size: 6rem;
    letter-spacing: 4px;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .zzz-text {
    font-size: 9rem;
    letter-spacing: 6px;
  }
}
</style>
