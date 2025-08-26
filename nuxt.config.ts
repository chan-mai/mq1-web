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
  modules: ["@nuxtjs/tailwindcss", "@vueuse/nuxt", "@nuxt/icon", "nuxt-gtag", "@nuxtjs/sitemap", "@nuxt/image"],
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
    id: process.env.GA_TRACKING_ID,
  },
  runtimeConfig: {
    public: {
      siteName: "まいの雑記帳",
      siteDescription: "ちっちゃなうぇぶさいと",
      siteUrl: "https://mq1.dev/",
      siteOgpUrl: "https://mq1.dev/ogp/ogp.png",
      microcms: {
        serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
        apiKey: process.env.MICROCMS_API_KEY,
      }
    },
  },
  routeRules: {
    "/": { prerender: true },
    "/about": { prerender: true },
    // "/search/**": { ssr: true, headers: { 'Cache-Control': 'public, max-age=60, immutable' } },
    "/feed.xml": {
      headers: { "content-type": "application/rss+xml; charset=UTF-8" },
    },
  },
  nitro: {
    prerender: {
      autoSubfolderIndex: true,
      crawlLinks: false,
      routes: [],
      failOnError: false,
    }
  },
  hooks: {
    async "nitro:config"(nitroConfig) {
      if (nitroConfig.dev)  return;
      if (nitroConfig.prerender?.routes === undefined) return;
      
      const client = createClient({
        serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
        apiKey: process.env.MICROCMS_API_KEY!,
      });

      const [articles, tags] = await Promise.all([
        client.get({
          endpoint: 'articles',
          queries: {
            limit: 100,
            orders: "-publishedAt",
          },
        }),
        client.get({
          endpoint: 'tags',
          queries: {
            limit: 100,
            orders: "-publishedAt",
          },
        }),
      ]);
      
      // タグ
      const tagRoutes = tags.contents.map((mount: any) => `/tag/${mount.id}`);
      // 記事
      const articleRoutes = articles.contents.map((mount: any) => `/entry/${mount.id}`);

      nitroConfig.prerender.routes = [
        ...nitroConfig.prerender.routes,
        ...tagRoutes,
        ...articleRoutes,
      ];
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

          const articles = await client.getAllContents({
            endpoint: "articles",
          });

          return articles.map((article: any) => ({
            loc: `/entry/${article.id}`,
            lastmod: article.updatedAt || article.publishedAt,
          }));
        },
      },
      tags: {
        urls: async () => {
          const client = createClient({
            serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
            apiKey: process.env.MICROCMS_API_KEY!,
          });

          const tags = await client.getAllContents({
            endpoint: "tags",
          });

          return tags.map((tag: any) => ({
            loc: `/tag/${tag.id}`,
            lastmod: tag.updatedAt || tag.publishedAt,
          }));
        },
      },
    },
  },
  image: {
    dir: "public/images",
    domains: ["images.microcms-assets.io"],
  },
});