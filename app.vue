<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtLoadingIndicator color="#fc9fa8" :height="10" :duration="3000" :throttle="1" />
    <NuxtPage />
  </NuxtLayout>
</template>
