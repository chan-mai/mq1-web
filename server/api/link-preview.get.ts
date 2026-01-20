import * as cheerio from 'cheerio';

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
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    };

    const checkMisskey = async (hostname: string): Promise<boolean> => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
            const response = await fetch(`https://servers.misskey.ink/api/v1/check?domain=${hostname}`, {
                signal: controller.signal
            });
            if (!response.ok) return false;
            const data = await response.json();
            return data.isMisskey === true;
        } catch (e) {
            console.error('Misskey check failed or timed out:', e);
            return false;
        } finally {
            clearTimeout(timeout);
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
            const [ogData, isMisskey] = await Promise.all([
                fetchOgTask(),
                checkMisskey(target.hostname)
            ]);

            let type: LinkPreviewType = 'GENERAL';
            if (isMisskey) {
                const pathname = target.pathname;
                if (/\/notes\/[a-zA-Z0-9]+/.test(pathname)) {
                    type = 'MISSKEY_NOTE';
                } else if (/\/tags\/[^\/]+/.test(pathname)) {
                    type = 'MISSKEY_HASHTAG';
                } else if (/\/@[\w.]+/.test(pathname) || /\/users\/[a-zA-Z0-9]+/.test(pathname)) {
                    type = 'MISSKEY_USER';
                } else if (/\/clips\/[a-zA-Z0-9]+/.test(pathname)) {
                    type = 'MISSKEY_CLIP';
                }
            }

            let code: string | undefined;
            let startLine: number | undefined;
            let endLine: number | undefined;
            let embedId: string | undefined;

            const pathname = target.pathname;

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
