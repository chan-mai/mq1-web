<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const route = useRoute()

useHead(() => {
  const siteUrl = runtimeConfig.public.siteUrl.replace(/\/$/, '')
  const path = route.path
  
  const url = new URL(path, siteUrl)
  
  if (route.query.page) {
    url.searchParams.set('page', route.query.page.toString())
  }
  
  return {
    link: [
      {
        rel: 'canonical',
        href: url.toString()
      }
    ]
  }
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtLoadingIndicator color="#fc9fa8" :height="3" :duration="3000" :throttle="1" />
    <NuxtPage />
  </NuxtLayout>
  <MqToast />
</template>
