<template>
    <main class="bg-back text-slate-600">
        <SiteHeader />
        <div class="relative z-0 mx-auto min-w-screen box-content flex min-h-[calc(100vh-30rem)] flex-col px-6">
            <slot />
        </div>
        <SiteFooter />
    </main>
    <MqRssCta type="floating" />
</template>