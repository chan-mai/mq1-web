<script setup lang="ts">
const wrapper = useTemplateRef<HTMLElement>('wrapper');
const showIndicator = ref(false);
const dismissed = ref(false);

let tableElement: HTMLElement | null = null;

const onScroll = () => {
  dismissed.value = true;
};

const check = () => {
  tableElement = wrapper.value?.querySelector('table') ?? null;
  showIndicator.value = Boolean(
    tableElement && tableElement.scrollWidth > tableElement.clientWidth + 1,
  );
};

onMounted(() => {
  check();
  tableElement?.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  tableElement?.removeEventListener('scroll', onScroll);
});

useResizeObserver(wrapper, check);
</script>

<template>
  <div ref="wrapper" class="scrollable-wrapper">
    <slot />
    <div v-if="showIndicator && !dismissed" class="scroll-indicator">
      スクロール可能です →
    </div>
  </div>
</template>
