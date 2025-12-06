<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/nuxt"
import { Analytics } from '@vercel/analytics/nuxt'
</script>
<template>
    <SpeedInsights/>
    <Analytics/>
    <main class="bg-back text-slate-600">
        <SiteHeader />
        <div class="relative z-0 mx-auto min-w-screen box-content flex min-h-[calc(100vh-30rem)] flex-col px-6 pt-[120px] md:pt-[160px]">
            <slot />
        </div>
        <SiteFooter />
    </main>
    <MqRssCta type="floating" />
</template>
