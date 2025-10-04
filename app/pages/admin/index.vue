<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'admin'
});

// /admin にアクセスしたらダッシュボードにリダイレクト
navigateTo('/admin/dashboard', { replace: true });
</script>

<template>
  <div></div>
</template>
