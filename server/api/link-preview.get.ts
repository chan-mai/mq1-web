import * as cheerio from 'cheerio';
import { isValidPublicIp } from '~~/server/utils/ip';

const MISSKEY_CHECK_TIMEOUT_MS = 5000;
const MISSKEY_CHECK_CACHE_TTL_MS = 10 * 60 * 1000;
const misskeyEmbedCheckCache = new Map<string, { value: boolean; expiresAt: number }>();
type MisskeyEmbedType = 'MISSKEY_NOTE' | 'MISSKEY_HASHTAG' | 'MISSKEY_USER' | 'MISSKEY_CLIP';

export default defineEventHandler(async (event): Promise<LinkPreviewResponse> => {
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
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal
            });
            if (response.status === 405) {
                const getResponse = await fetch(url, { method: 'GET', signal: controller.signal });
                return getResponse.ok;
            }
            return response.ok;
        } catch {
            return false;
        } finally {
            clearTimeout(timeout);
        }
    };

    const getMisskeyTypeFromPath = (pathname: string): MisskeyEmbedType | undefined => {
        if (/^\/notes\/[a-zA-Z0-9]+/.test(pathname)) {
            return 'MISSKEY_NOTE';
        }
        if (/^\/tags\/[^\/]+/.test(pathname)) {
            return 'MISSKEY_HASHTAG';
        }
        if (/^\/@[\w.]+/.test(pathname) || /^\/users\/[a-zA-Z0-9]+/.test(pathname)) {
            return 'MISSKEY_USER';
        }
        if (/^\/clips\/[a-zA-Z0-9]+/.test(pathname)) {
            return 'MISSKEY_CLIP';
        }
        return undefined;
    };

    const checkEmbeddable = async (hostname: string): Promise<boolean> => {
        const now = Date.now();
        const cached = misskeyEmbedCheckCache.get(hostname);
        if (cached && cached.expiresAt > now) return cached.value;

        const set = (v: boolean) => {
            misskeyEmbedCheckCache.set(hostname, { value: v, expiresAt: now + MISSKEY_CHECK_CACHE_TTL_MS });
            return v;
        };

        try {
            const { lookup } = await import('node:dns/promises');
            const addresses = await lookup(hostname, { all: true });
            if (!addresses.length) return set(false);
            if (!addresses.every(a => isValidPublicIp(a.address))) return set(false);
        } catch {
            return set(false);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), MISSKEY_CHECK_TIMEOUT_MS);

        try {
            const res = await fetch(`https://${hostname}/api/users/show`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'instance.actor' }),
                signal: controller.signal,
            });
            if (res.status !== 200) return set(false);
            const data = await res.json() as any;
            if (!data || typeof data.id !== 'string') return set(false);

            const embedUrl = `https://${hostname}/embed/user-timeline/${data.id}`;
            const check = async (method: 'HEAD' | 'GET'): Promise<boolean> => {
                try {
                    const r = await fetch(embedUrl, { method, redirect: 'follow', signal: controller.signal });
                    return r.status >= 200 && r.status < 300;
                } catch { return false; }
            };

            return set(await check('HEAD') || await check('GET'));
        } catch {
            return set(false);
        } finally {
            clearTimeout(timer);
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
                type: 'GENERAL' as const,
            };
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const fetchOgTask = async () => {
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
                    title,
                    description,
                    image,
                    favicon,
                };
            } catch (e) {
                console.error('Link preview fetch failed:', e);
                return {
                    title: FALLBACK_TITLE,
                    description: FALLBACK_DESCRIPTION,
                    image: undefined,
                    favicon: undefined,
                };
            }
        };

        try {
            const pathname = target.pathname;
            const misskeyType = getMisskeyTypeFromPath(pathname);
            const misskeySupportTask = (async (): Promise<boolean> => {
                if (!misskeyType) return false;
                return await checkEmbeddable(target.hostname);
            })();

            const [ogData, isMisskeyEmbeddable] = await Promise.all([
                fetchOgTask(),
                misskeySupportTask
            ]);

            let type: LinkPreviewType = misskeyType && isMisskeyEmbeddable ? misskeyType : 'GENERAL';

            let code: string | undefined;
            let startLine: number | undefined;
            let endLine: number | undefined;
            let embedId: string | undefined;

            // Platform Detection
            if (target.hostname.match(/(^|\.)(twitter\.com|x\.com)$/)) {
                 const match = pathname.match(/\/status\/(\d+)/);
                 if (match) {
                     type = 'TWITTER';
                     embedId = match[1];
                 }
            } else if (target.hostname.match(/(^|\.)(youtube\.com|youtu\.be)$/)) {
                // Handle youtube.com/watch?v=ID and youtu.be/ID
                if (target.hostname.includes('youtu.be')) {
                    embedId = pathname.slice(1);
                } else {
                    embedId = target.searchParams.get('v') || undefined;
                }
                if (embedId) {
                     type = 'YOUTUBE';
                }
            } else if (target.hostname.match(/(^|\.)instagram\.com$/)) {
                const match = pathname.match(/\/p\/([\w-]+)/);
                if (match) {
                    type = 'INSTAGRAM';
                    embedId = match[1];
                }
            }

            if (target.hostname === 'github.com') {
                const match = target.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
                if (match) {
                    const [, user, repo, commit, path] = match;
                    const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${commit}/${path}`;

                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);

                    try {
                        const response = await fetch(rawUrl, { signal: controller.signal });
                        if (response.ok) {
                            const text = await response.text();
                            const lines = text.split('\n');
                            const hash = target.hash;

                            let s = 1;
                            let e = 10; // Default to first 10 lines

                            const rangeMatch = hash.match(/#L(\d+)(?:-L(\d+))?/);
                            if (rangeMatch) {
                                const startStr = rangeMatch[1];
                                const endStr = rangeMatch[2];
                                if (startStr) {
                                  s = parseInt(startStr, 10);
                                  e = endStr ? parseInt(endStr, 10) : s;
                                }
                            } else {
                                // If no hash, default to first 10 lines
                                s = 1;
                                e = Math.min(lines.length, 10);
                            }

                            startLine = s;
                            endLine = e;

                            // Adjust 0-based index
                            const extracted = lines.slice(Math.max(0, s - 1), e).join('\n');

                            if (extracted.trim().length > 0) {
                                code = extracted;
                                type = 'GITHUB_PERMALINK';
                            }
                        }
                    } catch (e) {
                         console.error('Failed to fetch GitHub raw content or timed out:', e);
                         // type remains 'GENERAL' (default) if fetch fails
                    } finally {
                        clearTimeout(timeout);
                    }
                }
            }

            return {
                url: target.toString(),
                domain: target.hostname.replace(/^www\./, ''),
                ...ogData,
                type,
                embedId,
                code,
                startLine: code ? startLine : undefined,
                endLine: code ? endLine : undefined,
            };
        } finally {
            clearTimeout(timeout);
        }
    };

    return await fetchLinkPreview(rawUrl);
});
