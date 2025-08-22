<script setup lang="ts">
const scrollProgress = ref(0);

const calculateScrollProgress = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.value = Math.min(progress, 100);
};

const handleScroll = useThrottleFn(calculateScrollProgress, 16); // だいたい60fps

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  // 初期計算
  calculateScrollProgress();
});
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-100/50 backdrop-blur-sm">
    <div 
      class="h-full bg-gradient-to-r from-primary to-primary/80 shadow-sm transition-all duration-150 ease-out"
      :style="{ width: `${scrollProgress}%` }"
    />
  </div>
</template>
