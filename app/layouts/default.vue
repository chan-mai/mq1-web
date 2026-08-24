<template>
  <main class="bg-surface text-fg">
    <SiteHeader />
    <div
      class="relative z-0 mx-auto min-w-screen box-content flex min-h-[calc(100vh-30rem)] flex-col"
    >
      <slot />
    </div>
    <SiteFooter />
  </main>
  <MqRssCta type="floating" />
</template>
