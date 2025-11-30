import { createClient } from "microcms-js-sdk";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: true,
  devtools: {
    enabled: true,
  },
  css: ["~/assets/css/fonts.css", "~/assets/css/view-transitions.css"],
  app: {
    head: {
      charset: 'utf-16',
      viewport: 'width=device-width',
      link: [
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
    "@nuxtjs/turnstile",
    "nuxt-auth-utils",
    "nuxt-jsonld",
    "@nuxtjs/google-fonts",
    "@nuxtjs/critters",
    "@vite-pwa/nuxt",
  ],
  googleFonts: {
    families: {
      "Noto Sans JP": [300, 400, 500, 600, 700],
      "Abril Fatface": true,
      "Crafty Girls": true,
    },
    display: "swap",
    download: true,
    inject: true,
    useStylesheet: true,
    overwriting: true
  },
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
  runtimeConfig: {
    // サーバーサイドのみで使用する設定
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
    turnstile: {
      secretKey: process.env.TURNSTILE_SECRET_KEY,
    },
    oauth: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_SECRET,
      },
    },
    discord: {
      webhookUrl: process.env.DISCORD_WEBHOOK_URL,
    },
  },
  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY,
  },
  routeRules: {
    "/": { prerender: true },
    "/about": { prerender: true },
    "/entry/**": {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    },
    "/tag/**": {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    },
    "/articles": {
      headers: {
        "Cache-Control": "public, max-age=1800, s-maxage=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    },
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
    },
    compressPublicAssets: {
      gzip: true,
      brotli: true,
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
    async "nitro:config"(nitroConfig) {
      if (nitroConfig.dev) return;
      if (nitroConfig.prerender?.routes === undefined) return;

      const client = createClient({
        serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
        apiKey: process.env.MICROCMS_API_KEY!,
      });

      const [articles, tags] = await Promise.all([
        client.get({
          endpoint: "articles",
          queries: {
            limit: 100,
            orders: "-publishedAt",
          },
        }),
        client.get({
          endpoint: "tags",
          queries: {
            limit: 100,
            orders: "-publishedAt",
          },
        }),
      ]);

      // タグ
      const tagRoutes = tags.contents.map((mount: any) => `/tag/${mount.id}`);
      const tagOgRoutes = tags.contents.map((mount: any) => `/api/og/tag/${mount.id}`);
      // 記事
      const articleRoutes = articles.contents.map((mount: any) => `/entry/${mount.id}`);
      const articleOgRoutes = articles.contents.map((mount: any) => `/api/og/article/${mount.id}`);

      nitroConfig.prerender.routes = [
        ...nitroConfig.prerender.routes,
        ...tagRoutes,
        ...tagOgRoutes,
        ...articleRoutes,
        ...articleOgRoutes,
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
});
