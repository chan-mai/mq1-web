<template>
  <body>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="#fc9fa8" :height="10" :duration="3000" :throttle="0" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

  </body>
</template>
