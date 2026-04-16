<script lang="ts" setup>
const config = useWebConfig();

const props = defineProps({
    url: {
        type: String,
    },
    title: {
        type: String
    },
    subtitle: {
        type: String
    },
    copy: {
        type: String
    },
    textHidden: {
        type: Boolean,
        default: false
    }
});

const isSimpleMode = computed(() => !!props.url);
</script>

<template>
    <section class="relative w-full" data-header-inverse="true">
        <div class="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 opacity-80" />

        <!-- シンプルレイアウト（記事ページなど） -->
        <template v-if="isSimpleMode">
            <div class="mx-auto box-content grid h-auto md:h-96 w-full overflow-hidden relative">
                <div class="col-span-full row-span-full overflow-hidden transform transition-transform duration-300 hover:scale-[1.01] dot-overlay">
                    <picture>
                        <NuxtImg :src="url" format="webp" :alt="title" fetchpriority="high" class="block size-full object-cover" />
                    </picture>
                </div>
                <div v-if="!textHidden" class="col-span-full row-span-full flex flex-col items-start justify-center gap-4 text-left z-10 pt-[120px] md:pt-[160px] pl-[20px] md:pl-[60px]">
                    <div class="flex flex-col items-start gap-3 text-white">
                        <div class="mb-12 md:mb-24">
                            <h1 class="font-accent text-4xl sm:text-5xl md:text-6xl tracking-widest">
                                {{ title || config.siteName }}
                            </h1>
                            <p class="text-xs md:text-sm tracking-widest">{{ subtitle || config.siteDescription }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- トップページレイアウト -->
        <template v-else>
            <div class="absolute inset-0 overflow-hidden dot-overlay">
                <NuxtImg
                    src="/images/hero.png"
                    format="webp"
                    sizes="xs:100vw sm:100vw md:100vw lg:1200px"
                    :alt="title"
                    fetchpriority="high"
                    class="block size-full object-cover"
                />
            </div>

            <div v-if="!textHidden"
                 class="relative z-10 mx-auto max-w-7xl px-6 md:px-16
                        flex flex-col items-start justify-end
                        min-h-[300px] md:min-h-[380px]
                        pt-[140px] md:pt-[160px] pb-10 md:pb-14 gap-2">

                <p class="text-xs tracking-[0.25em] uppercase text-white/70 font-medium">
                    engineer &amp; creator
                </p>
                <h1 class="font-accent text-4xl sm:text-5xl md:text-7xl tracking-widest leading-tight text-white">
                    {{ title || config.siteName }}
                </h1>
                <p class="text-xs md:text-sm tracking-widest text-white/70">
                    {{ subtitle || config.siteDescription }}
                </p>
            </div>
        </template>
    </section>
</template>
