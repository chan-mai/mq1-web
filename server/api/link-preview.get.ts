import * as cheerio from 'cheerio';

const MISSKEY_CHECK_TIMEOUT_MS = 5000;
const MISSKEY_CHECK_CACHE_TTL_MS = 10 * 60 * 1000;
const misskeyNodeInfoCache = new Map<string, { value: boolean; expiresAt: number }>();
const misskeyEmbedCheckCache = new Map<string, { value: boolean; expiresAt: number }>();
type NodeInfoLink = { rel?: unknown; href?: unknown };
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

    const checkMisskeyByNodeInfo = async (hostname: string): Promise<boolean> => {
        const now = Date.now();
        const cached = misskeyNodeInfoCache.get(hostname);
        if (cached && cached.expiresAt > now) {
            return cached.value;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), MISSKEY_CHECK_TIMEOUT_MS);
        try {
            const nodeInfoIndexResponse = await fetch(`https://${hostname}/.well-known/nodeinfo`, {
                signal: controller.signal
            });
            if (!nodeInfoIndexResponse.ok) {
                misskeyNodeInfoCache.set(hostname, {
                    value: false,
                    expiresAt: now + MISSKEY_CHECK_CACHE_TTL_MS,
                });
                return false;
            }

            const nodeInfoIndex = await nodeInfoIndexResponse.json();
            const links = Array.isArray(nodeInfoIndex?.links) ? (nodeInfoIndex.links as NodeInfoLink[]) : [];
            const link21 = links.find((link) => typeof link.rel === 'string' && link.rel.includes('/2.1'));
            const link20 = links.find((link) => typeof link.rel === 'string' && link.rel.includes('/2.0'));
            const href21 = typeof link21?.href === 'string' ? link21.href : undefined;
            const href20 = typeof link20?.href === 'string' ? link20.href : undefined;
            const href = href21 ?? href20;
            if (!href) {
                misskeyNodeInfoCache.set(hostname, {
                    value: false,
                    expiresAt: now + MISSKEY_CHECK_CACHE_TTL_MS,
                });
                return false;
            }

            const nodeInfoUrl = new URL(href, `https://${hostname}`).toString();
            const nodeInfoResponse = await fetch(nodeInfoUrl, { signal: controller.signal });
            if (!nodeInfoResponse.ok) {
                misskeyNodeInfoCache.set(hostname, {
                    value: false,
                    expiresAt: now + MISSKEY_CHECK_CACHE_TTL_MS,
                });
                return false;
            }

            const nodeInfo = await nodeInfoResponse.json();
            const softwareName = nodeInfo?.software?.name;
            const isMisskey = typeof softwareName === 'string' && softwareName.toLowerCase() === 'misskey';
            misskeyNodeInfoCache.set(hostname, {
                value: isMisskey,
                expiresAt: now + MISSKEY_CHECK_CACHE_TTL_MS,
            });
            return isMisskey;
        } catch {
            misskeyNodeInfoCache.set(hostname, {
                value: false,
                expiresAt: now + MISSKEY_CHECK_CACHE_TTL_MS,
            });
            return false;
        } finally {
            clearTimeout(timeout);
        }
    };

    const isBlockedByFrameHeaders = (headers: Headers): boolean => {
        const xFrameOptions = headers.get('x-frame-options')?.toLowerCase() ?? '';
        if (xFrameOptions.includes('deny') || xFrameOptions.includes('sameorigin')) {
            return true;
        }

        const csp = headers.get('content-security-policy')?.toLowerCase() ?? '';
        if (!csp.includes('frame-ancestors')) {
            return false;
        }
        const frameAncestorsDirective = csp
            .split(';')
            .find((directive) => directive.trim().startsWith('frame-ancestors'));
        if (!frameAncestorsDirective) {
            return false;
        }
        return frameAncestorsDirective.includes("'none'") || frameAncestorsDirective.includes("'self'");
    };

    const resolveMisskeyUserId = async (target: URL, signal: AbortSignal): Promise<string | undefined> => {
        const segments = target.pathname.split('/').filter(Boolean);
        if (segments.length >= 2 && segments[0] === 'users') {
            return segments[1];
        }
        const head = segments[0] ?? '';
        if (!head.startsWith('@')) {
            return undefined;
        }

        const rawUsername = head.slice(1);
        const username = rawUsername.split('@')[0];
        if (!username) {
            return undefined;
        }

        try {
            const response = await fetch(`https://${target.hostname}/api/users/show`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
                signal,
            });
            if (!response.ok) {
                return undefined;
            }
            const userInfo = await response.json();
            return typeof userInfo?.id === 'string' ? userInfo.id : undefined;
        } catch {
            return undefined;
        }
    };

    const getMisskeyEmbedProbeUrl = async (
        target: URL,
        misskeyType: MisskeyEmbedType,
        signal: AbortSignal
    ): Promise<string | undefined> => {
        const segments = target.pathname.split('/').filter(Boolean);
        if (misskeyType === 'MISSKEY_NOTE') {
            return segments.length >= 2 && segments[0] === 'notes'
                ? `https://${target.hostname}/embed/notes/${segments[1]}`
                : undefined;
        }
        if (misskeyType === 'MISSKEY_HASHTAG') {
            return segments.length >= 2 && segments[0] === 'tags'
                ? `https://${target.hostname}/embed/tags/${segments[1]}`
                : undefined;
        }
        if (misskeyType === 'MISSKEY_CLIP') {
            return segments.length >= 2 && segments[0] === 'clips'
                ? `https://${target.hostname}/embed/clips/${segments[1]}`
                : undefined;
        }
        const userId = await resolveMisskeyUserId(target, signal);
        return userId ? `https://${target.hostname}/embed/user-timeline/${userId}` : undefined;
    };

    const checkMisskeyEmbedReachable = async (
        target: URL,
        misskeyType: MisskeyEmbedType
    ): Promise<boolean> => {
        const cacheKey = `${target.hostname}|${misskeyType}|${target.pathname}`;
        const now = Date.now();
        const cached = misskeyEmbedCheckCache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return cached.value;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), MISSKEY_CHECK_TIMEOUT_MS);
        try {
            const probeUrl = await getMisskeyEmbedProbeUrl(target, misskeyType, controller.signal);
            if (!probeUrl) {
                misskeyEmbedCheckCache.set(cacheKey, {
                    value: false,
                    expiresAt: now + MISSKEY_CHECK_CACHE_TTL_MS,
                });
                return false;
            }

            const nonce = `r=${Date.now().toString(36)}`;
            const probeUrlWithNonce = `${probeUrl}${probeUrl.includes('?') ? '&' : '?'}${nonce}`;

            let response = await fetch(probeUrlWithNonce, {
                method: 'HEAD',
                signal: controller.signal
            });
            if (response.status === 405) {
                response = await fetch(probeUrlWithNonce, {
                    method: 'GET',
                    signal: controller.signal
                });
            }

            const embeddable = response.ok && !isBlockedByFrameHeaders(response.headers);
            misskeyEmbedCheckCache.set(cacheKey, {
                value: embeddable,
                expiresAt: now + MISSKEY_CHECK_CACHE_TTL_MS,
            });
            return embeddable;
        } catch {
            misskeyEmbedCheckCache.set(cacheKey, {
                value: false,
                expiresAt: now + MISSKEY_CHECK_CACHE_TTL_MS,
            });
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
            const pathname = target.pathname;
            const misskeyType = getMisskeyTypeFromPath(pathname);
            const misskeySupportTask = (async (): Promise<boolean> => {
                if (!misskeyType) return false;
                const isMisskeyByNodeInfo = await checkMisskeyByNodeInfo(target.hostname);
                if (!isMisskeyByNodeInfo) return false;
                return await checkMisskeyEmbedReachable(target, misskeyType);
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
