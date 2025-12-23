import * as cheerio from 'cheerio';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const rawUrl = query.url as string;

    if (!rawUrl) {
        throw createError({
            statusCode: 400,
            statusMessage: 'URL is required',
        });
    }

    const FALLBACK_TITLE = 'リンク';
    const FALLBACK_DESCRIPTION = 'このサイトをチェック';

    const normalizeUrl = (u: string): string => {
        const trimmed = u.trim();
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

    const isImageReachable = async (url: string): Promise<boolean> => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    };

    const fetchLinkPreview = async (url: string) => {
        const normalized = normalizeUrl(url);
        let target: URL;
        try {
            target = new URL(normalized);
        } catch {
            return {
                url: url,
                domain: url,
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

            let image = resolveUrl(
                target,
                pickFirst(
                    getMeta('meta[property="og:image"]', 'content'),
                    getMeta('meta[name="twitter:image"]', 'content')
                )
            );

            // Verify image accessibility
            if (image) {
                const reachable = await isImageReachable(image);
                if (!reachable) {
                    image = undefined;
                }
            }

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
        } catch (e) {
            console.error('Link preview fetch failed:', e);
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

    return await fetchLinkPreview(rawUrl);
});
