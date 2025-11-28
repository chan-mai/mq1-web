export default defineEventHandler(async (event) => {
    const tagId = getRouterParam(event, 'tagId');
    if (!tagId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Tag ID is required',
        });
    }

    try {
        const tag = await fetchTag(tagId);
        const ogUrl = generateOgImageUrl(`「#${tag.name}」が含まれる記事`);
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
