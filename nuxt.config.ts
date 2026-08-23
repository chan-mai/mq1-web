import { unwasm } from "unwasm/plugin";

const isProductionBuild = process.env.NODE_ENV === "production";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: true,
  devtools: {
    enabled: true,
  },
  css: [
    "kiso.css",
    "~/assets/css/theme.css",
    "~/assets/css/fonts.css",
    "~/assets/css/view-transitions.css",
    "~/assets/css/hljs-theme.css",
    "~/assets/css/scrollbar.css",
  ],
  app: {
    head: {
      viewport: "width=device-width",
      link: [
        { rel: "canonical", href: "https://mq1.dev/" },
        { rel: "stylesheet", href: "https://use.typekit.net/knf0bwf.css" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
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
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@nuxt/icon",
    "@nuxtjs/sitemap",
    "@nuxt/image",
    "nuxt-jsonld",
    "@nuxtjs/critters",
    "@vite-pwa/nuxt",
    "@nuxtjs/robots",
    "@nuxt/scripts",
    "nitro-cloudflare-dev",
  ],
  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "mq1-color-mode",
  },
  $production: {
    scripts: {
      registry: {
        clarity: { id: "wgvzak7jwb" },
        googleAnalytics: { id: "G-ZHPDFE19FX" },
      },
    },
  },
  runtimeConfig: {
    sessionPassword: "",
    zitadel: {
      issuer: "",
      clientId: "",
    },
    openaiApiKey: "",
    openaiModel: "gpt-4o-mini",
    public: {
      siteName: "まいの雑記帳",
      siteDescription: "ちっちゃなうぇぶさいと",
      siteUrl:
        process.env.NODE_ENV === "production"
          ? "https://mq1.dev/"
          : "http://localhost:3000/",
      siteOgpUrl:
        process.env.NODE_ENV === "production"
          ? "https://mq1.dev/images/ogp/ogp.png"
          : "http://localhost:3000/images/ogp/ogp.png",
    },
  },
  routeRules: {
    "/about": { prerender: true },
    "/privacy": { prerender: true },
    "/admin/**": { ssr: false },
  },
  nitro: {
    preset:
      process.env.NITRO_PRESET ??
      (isProductionBuild ? "cloudflare-module" : undefined),
    cloudflareDev: {
      environment: "dev",
    },
    rollupConfig: {
      plugins: [unwasm({ esmImport: isProductionBuild, silent: true })],
    },
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
  experimental: {
    viewTransition: true,
    payloadExtraction: true,
    renderJsonPayloads: true,
    componentIslands: true,
  },
  site: {
    url: "https://mq1.dev/",
    name: "まいの雑記帳",
    defaultLocale: "ja",
  },
  sitemap: {
    exclude: ["/admin", "/admin/**"],
    sitemaps: {
      pages: {
        includeAppSources: true,
      },
      articles: {
        sources: ["/api/__sitemap__/articles"],
      },
      tags: {
        sources: ["/api/__sitemap__/tags"],
      },
    },
  },
  image: {
    // Workers上でipx(sharp)が動作しないため本番は変換なし配信
    provider: isProductionBuild ? "none" : "ipx",
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
      navigateFallbackDenylist: [/^\/admin/, /^\/api\//, /^\/images\/r2\//],
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
          manualChunks(id) {
            if (
              id.includes("/node_modules/vue/") ||
              id.includes("/node_modules/vue-router/")
            ) {
              return "vendor";
            }
            if (id.includes("/node_modules/cheerio/")) {
              return "cheerio";
            }
            if (id.includes("/node_modules/highlight.js/")) {
              return "hljs";
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: ["cheerio"],
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
        disallow: [
          "/admin/",
          "/api/admin/",
          "/api/comment/",
          "/api/entry/",
          "/api/like/",
          "/api/link-preview",
          "/api/popular-articles",
          "/_nuxt/",
        ],
      },
    ],
  },
});
