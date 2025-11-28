export default defineEventHandler(async (event) => {
    const contentId = getRouterParam(event, 'contentId');
    if (!contentId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Content ID is required',
        });
    }

    try {
        const article = await fetchArticle(contentId);
        if (!article) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Article not found',
            });
        }

        // eyecatchがあればそれをレスポンス
        if (article.eyecatch) {
            const imageResponse = await fetch(article.eyecatch.url);
            if (!imageResponse.ok) {
                throw createError({
                    statusCode: 500,
                    statusMessage: 'Failed to fetch OG image',
                });
            }
            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            setHeader(event, 'Content-Type', imageResponse.headers.get('Content-Type') || 'image/webp');
            setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
            return buffer;
        }

        const ogUrl = generateOgImageUrl(article.title);
        const imageResponse = await fetch(ogUrl);
        
        if (!imageResponse.ok) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to fetch OG image',
            });
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        setHeader(event, 'Content-Type', 'image/webp');
        setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
        
        return buffer;
    } catch (e: any) {
        console.error(e);
        throw createError({
            statusCode: e.statusCode || 500,
            statusMessage: e.statusMessage || 'Internal Server Error',
        });
    }
});
