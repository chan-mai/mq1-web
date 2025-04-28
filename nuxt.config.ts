import { createClient } from "microcms-js-sdk";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: true,
  srcDir: "src/",

  devtools: {
    enabled: true,
  },
  css: ["~/assets/css/fonts.css", "~/assets/css/view-transitions.css"],
  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Crafty+Girls&display=swap",
        },
      ],
      htmlAttrs: {
        lang: "ja",
        prefix: "og: https://ogp.me/ns#",
      },
    },
  },
  plugins: [{ src: "~/plugins/loading.ts", mode: "client" }],
  modules: [
    "@nuxtjs/tailwindcss",
    "@vueuse/nuxt",
    "@nuxt/icon",
    "nuxt-gtag",
    "@nuxtjs/sitemap",
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
  gtag: {
    id: "G-ZHPDFE19FX",
  },
  runtimeConfig: {
    public: {
      siteName: "まいの雑記帳",
      siteDescription: "ちっちゃなうぇぶさいと",
      siteUrl: "https://mq1.dev/",
      siteOgpUrl: "https://mq1.dev/ogp.png",
    },
    serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
    apiKey: process.env.MICROCMS_API_KEY,
  },
  nitro: {
    prerender: {
      routes: ["/feed.xml"],
      autoSubfolderIndex: true,
      crawlLinks: true,
      failOnError: false,
    },
  },
  routeRules: {
    "/feed.xml": {
      headers: { "content-type": "application/rss+xml; charset=UTF-8" },
    },
  },
  experimental: {
    viewTransition: true,
  },
  site: {
    url: "https://mq1.dev/",
    name: "まいの雑記帳",
    defaultLocale: "ja",
  },
  sitemap: {
    sitemaps: {
      pages: {
        includeAppSources: true,
      },
      articles: {
        urls: async () => {
          const client = createClient({
            serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
            apiKey: process.env.MICROCMS_API_KEY!,
          });

          const contents = await client.getAllContents({
            endpoint: "articles",
          });

          return contents.map((post: any) => ({
            loc: `/entry/${post.id}`,
            lastmod: post.updatedAt || post.publishedAt,
          }));
        },
      },
      tag: {
        urls: async () => {
          const client = createClient({
            serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
            apiKey: process.env.MICROCMS_API_KEY!,
          });

          const contents = await client.getAllContents({
            endpoint: "tags",
          });

          return contents.map((post: any) => ({
            loc: `/tag/${post.id}`,
            lastmod: post.updatedAt || post.publishedAt,
          }));
        },
      },
    },
  },
});
