<script setup lang="ts">
const ZZZ = () =>
  h(
    'div',
    {
      class:
        'whitespace-nowrap text-[12rem] select-none font-extrabold tracking-[10px] h-fit leading-[0.95] text-[#f5f5f5] opacity-10 max-[768px]:text-[9rem] max-[768px]:tracking-[6px] max-[640px]:text-[6rem] max-[640px]:tracking-[4px]',
    },
    'MAI SUDACHI',
  );

const breakpoint = ref('md');

const zzzs = computed(() => Array(500).fill(ZZZ));

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
    <div
      class="absolute z-[1] flex items-center justify-center overflow-hidden max-w-full w-full h-full max-h-[75rem]"
      data-header-inverse="true"
    >
      <div
        class="absolute w-full h-full z-[2] bg-gradient-to-b from-transparent to-accent"
      ></div>
      <div class="-rotate-45">
        <div
          v-for="(zzzs, i) in splitZzzs"
          :key="`row-${i}`"
          class="flex flex-row"
        >
          <div
            v-for="(doubleZzzs, j) in zzzs"
            :key="`group-${i}-${j}`"
            class="flex flex-row"
            :class="i % 2 === 0 ? 'animate-slide-left' : 'animate-slide-right'"
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
.animate-slide-left {
  animation: slide-to-left-full 200s linear infinite;
}

.animate-slide-right {
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
</style>
