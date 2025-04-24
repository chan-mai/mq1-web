import { createClient } from 'microcms-js-sdk';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: true,
  srcDir: "src/",

  devtools: {
    enabled: true,
  },
  css: ['~/assets/css/fonts.css'],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap' },
      ],
      htmlAttrs: {
        lang: 'ja', 
        prefix: 'og: https://ogp.me/ns#'
      },
    },
  },
  modules: [
    "@nuxtjs/tailwindcss",
    "@vueuse/nuxt",
    "@nuxt/icon",
    [
      "nuxt-microcms-module",
      {
        serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
        apiKey: process.env.MICROCMS_API_KEY,
      },
    ],
  ],
  tailwindcss: {
    config: {
      theme: {
        extend: {
          colors: {
            primary: "#fc9fa8",
            accent: "#f57aa5",
            back: "#f5f3f3",
          },
        },
      },
    },
  },
  runtimeConfig: {
    public: {
      siteName: 'まいの雑記帳',
      siteDescription: 'ちっちゃなうぇぶさいと',
      siteUrl: 'https://mq1.dev/',
      siteOgpUrl: 'https://mq1.dev/ogp.png',
    },
    serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
    apiKey: process.env.MICROCMS_API_KEY,
},
  nitro: {
    prerender: {
      routes: ['/feed.xml'],
      autoSubfolderIndex: true,
      crawlLinks: true,
      failOnError: false,
    },
  },
  routeRules: {
    '/feed.xml': {
      headers: { 'content-type': 'application/rss+xml; charset=UTF-8' },
    }
  },
  experimental: {
    viewTransition: true,
  },
  hooks: {
    async "nitro:config"(nitroConfig) {
      if (nitroConfig.dev) {
        return;
      }
      
      const client = createClient({
        serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
        apiKey: process.env.MICROCMS_API_KEY!,
      })
      const res: any = await client.get({
        endpoint: 'articles',
      });

      if (nitroConfig.prerender?.routes === undefined) {
        return;
      }
      
      nitroConfig.prerender.routes = res.contents.map((mount: any) => {
        return `/entry/${mount.id}`;
      });
    },
  },
});
