import { createClient, type MicroCMSListResponse } from "microcms-js-sdk";
import type { MicroCMSObject } from '#shared/types/microccms';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: true,
  devtools: {
    enabled: true,
  },
  css: ["kiso.css", "~/assets/css/fonts.css", "~/assets/css/view-transitions.css"],
  app: {
    head: {
      charset: 'utf-16',
      viewport: 'width=device-width',
      link: [
        { rel: "canonical", href: "https://mq1.dev/" },
        { rel: "stylesheet", href: "https://use.typekit.net/knf0bwf.css" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "dns-prefetch", href: "https://images.microcms-assets.io" },
        { rel: "preconnect", href: "https://images.microcms-assets.io" },
        { rel: "preconnect", href: "https://www.googletagmanager.com" },
      ],
      htmlAttrs: {
        lang: "ja",
        prefix: "og: https://ogp.me/ns#",
      },
    },
  },
  modules: [
    "@nuxtjs/tailwindcss",
    "@vueuse/nuxt",
    "@nuxt/icon",
    "nuxt-gtag",
    "@nuxtjs/sitemap",
    "@nuxt/image",
    "nuxt-jsonld",
    "@nuxtjs/critters",
    "@vite-pwa/nuxt",
    "@nuxtjs/robots",
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
    enabled: process.env.NODE_ENV === 'production',
    id: process.env.GA_TRACKING_ID,
  },
  scripts: {
    registry: {
      clarity: {
        id: 'wgvzak7jwb',
        trigger: 'onNuxtReady',
      }
    }
  },
  runtimeConfig: {
    public: {
      siteName: "まいの雑記帳",
      siteDescription: "ちっちゃなうぇぶさいと",
      siteUrl: process.env.NODE_ENV === "production" ? "https://mq1.dev/" : "http://localhost:3000/",
      siteOgpUrl: process.env.NODE_ENV === "production" ? "https://mq1.dev/images/ogp/ogp.png" : "http://localhost:3000/images/ogp/ogp.png",
      microcms: {
        serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
        apiKey: process.env.MICROCMS_API_KEY,
      },
    },
  },
  routeRules: {
    "/": { prerender: true },
    "/about": { prerender: true },
    "/privacy": { prerender: true },
    "/articles": { prerender: true },
    "/entry/**": { prerender: true },
    "/tag/**": { prerender: true },
  },
  nitro: {
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
    prerender: {
      failOnError: false,
    },
    routeRules: {
      "/**": {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      },
    },
  },
  hooks: {
    async 'nitro:config'(nitroConfig: any) {
      if (!process.env.MICROCMS_SERVICE_DOMAIN || !process.env.MICROCMS_API_KEY) return;
      const client = createClient({
        serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
        apiKey: process.env.MICROCMS_API_KEY!,
      });
      const [articles, tags] = await Promise.all([
        client.getAllContents({ endpoint: "articles" }),
        client.getAllContents({ endpoint: "tags" }),
      ]);
      nitroConfig.prerender = nitroConfig.prerender || {};
      nitroConfig.prerender.routes = [
        ...((nitroConfig.prerender.routes as string[]) || []),
        ...articles.map((a: any) => `/entry/${a.id}`),
        ...tags.map((t: any) => `/tag/${t.slug}`),
      ];
    },
  },
  experimental: {
    viewTransition: true,
    payloadExtraction: false,
    renderJsonPayloads: true,
    componentIslands: true,
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
            loc: `/tag/${tag.slug}`,
            lastmod: tag.updatedAt || tag.publishedAt,
          }));
        },
      },
    },
  },
  image: {
    domains: ["images.microcms-assets.io"],
    provider: "ipx",
    ipx: {
      maxAge: 31536000,
    },
    format: ["webp", "avif", "jpeg", "jpg", "png"],
    quality: 80,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    presets: {
      hero: {
        modifiers: {
          format: "webp",
          quality: 80,
          width: 1200,
          height: 600,
        },
      },
      thumbnail: {
        modifiers: {
          format: "webp",
          quality: 70,
          width: 400,
          height: 300,
        },
      },
    },
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "まいの雑記帳",
      short_name: "まいの雑記帳",
      description: "ちっちゃなうぇぶさいと",
      theme_color: "#fc9fa8",
    },
    workbox: {
      navigateFallback: "/",
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },
  vite: {
    esbuild: {
      drop: ["console", "debugger"],
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["vue", "vue-router"],
            microcms: ["microcms-js-sdk"],
            cheerio: ["cheerio"],
            hljs: ["highlight.js"],
          },
        },
      },
    },
    optimizeDeps: {
      include: ["cheerio", "microcms-js-sdk"],
    },
  },
  webpack: {
    optimization: {
      minimize: true,
    },
    optimizeCSS: true,
  },
  robots: {
    sitemap: "https://mq1.dev/sitemap.xml",
    groups: [
      {
        userAgent: ["*"],
        allow: ["/"],
        disallow: ["/admin/", "/api/admin/", "/api/comment/", "/api/entry/", "/api/like/", "/api/link-preview", "/api/popular-articles", "/_nuxt/"],
      },
    ],
  },
});
