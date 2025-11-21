<script setup lang="ts">
import * as cheerio from 'cheerio';

type LinkCardPreview = {
    url: string;
    domain: string;
    title: string;
    description: string;
    image?: string;
    favicon?: string;
};

const props = defineProps<{
    url: string;
}>();

const FALLBACK_TITLE = 'リンク';
const FALLBACK_DESCRIPTION = 'このサイトをチェック';

const normalizeUrl = (rawUrl: string): string => {
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
    }
    return trimmed;
};

const resolveUrl = (base: URL, candidate?: string | null): string | undefined => {
    if (!candidate) return undefined;
    try {
        return new URL(candidate, base).toString();
    } catch {
        return undefined;
    }
};

const pickFirst = (...values: Array<string | undefined | null>): string | undefined => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return undefined;
};

const fetchLinkPreview = async (rawUrl: string): Promise<LinkCardPreview> => {
    const normalized = normalizeUrl(rawUrl);
    let target: URL;
    try {
        target = new URL(normalized);
    } catch {
        return {
            url: rawUrl,
            domain: rawUrl,
            title: FALLBACK_TITLE,
            description: FALLBACK_DESCRIPTION,
        };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
        const response = await fetch(normalized, {
            headers: {
                'User-Agent': 'mq-link-preview/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch preview: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const getMeta = (selector: string, attr: string) => $(selector).attr(attr)?.trim();

        const title = pickFirst(
            getMeta('meta[property="og:title"]', 'content'),
            getMeta('meta[name="twitter:title"]', 'content'),
            $('title').first().text()
        ) ?? FALLBACK_TITLE;

        const description = pickFirst(
            getMeta('meta[property="og:description"]', 'content'),
            getMeta('meta[name="twitter:description"]', 'content'),
            getMeta('meta[name="description"]', 'content'),
            $('p').first().text()
        ) ?? FALLBACK_DESCRIPTION;

        const image = resolveUrl(
            target,
            pickFirst(
                getMeta('meta[property="og:image"]', 'content'),
                getMeta('meta[name="twitter:image"]', 'content')
            )
        );

        const faviconSelectors = [
            'link[rel="icon"]',
            'link[rel="shortcut icon"]',
            'link[rel="alternate icon"]',
            'link[rel="apple-touch-icon"]',
            'link[rel="mask-icon"]',
        ];

        let favicon: string | undefined;
        for (const selector of faviconSelectors) {
            const candidate = $(selector).attr('href');
            const resolved = resolveUrl(target, candidate);
            if (resolved) {
                favicon = resolved;
                break;
            }
        }

        return {
            url: target.toString(),
            domain: target.hostname.replace(/^www\./, ''),
            title,
            description,
            image,
            favicon,
        };
    } catch {
        return {
            url: normalized,
            domain: target.hostname.replace(/^www\./, ''),
            title: FALLBACK_TITLE,
            description: FALLBACK_DESCRIPTION,
        };
    } finally {
        clearTimeout(timeout);
    }
};

const isImageReachable = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
};

const preview = await fetchLinkPreview(props.url);

if (preview.image) {
    const reachable = await isImageReachable(preview.image);
    if (!reachable) {
        delete preview.image;
    }
}
</script>

<template>
    <div class="mq-link-card">
        <NuxtLink
            :to="preview.url"
            :external="true"
            target="_blank"
            rel="noopener noreferrer"
            class="mq-link-card__link group block w-full transition-colors duration-200"
        >
            <div
                class="flex items-stretch overflow-hidden rounded-2xl bg-white border-2 border-secondary/40 transition-colors duration-200 hover:bg-primary/5 hover:border-primary/50"
            >
                <div
                    v-if="preview.image"
                    class="flex flex-shrink-0 overflow-hidden bg-secondary/20 self-stretch basis-32 sm:basis-48 lg:basis-56"
                >
                    <NuxtImg
                        :src="preview.image"
                        :alt="preview.title"
                        :width="640"
                        :height="360"
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 35vw, 45vw"
                        class="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                </div>

                <div class="flex flex-1 flex-col justify-between gap-3 p-5">
                    <div class="flex items-center gap-2 min-w-0">
                        <NuxtImg
                            v-if="preview.favicon"
                            :src="preview.favicon"
                            alt=""
                            class="flex-shrink-0 rounded-sm size-4"
                            loading="lazy"
                            decoding="async"
                        />
                        <p class="text-xs font-medium text-muted-foreground truncate">{{ preview.domain }}</p>
                    </div>

                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-foreground line-clamp-2 text-base transition-colors duration-200 group-hover:text-primary">
                            {{ preview.title || FALLBACK_TITLE }}
                        </h3>
                        <p
                            v-if="preview.description"
                            class="text-sm text-muted-foreground line-clamp-2 mt-1.5 transition-colors duration-200 group-hover:text-primary/80"
                        >
                            {{ preview.description }}
                        </p>
                    </div>

                    <div class="flex items-center justify-end">
                        <div
                            class="flex items-center gap-1 text-secondary/60 transition-colors duration-200 group-hover:text-primary"
                        >
                            <Icon name="material-symbols:arrow-outward-rounded" class="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>
        </NuxtLink>
    </div>
</template>
