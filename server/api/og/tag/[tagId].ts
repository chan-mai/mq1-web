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
        // Twitter用にPNG形式を使用（TwitterクローラーのWebP互換性問題を回避）
        const ogUrlObj = new URL(generateOgImageUrl(`「#${tag.name}」が含まれる記事`));
        ogUrlObj.searchParams.set('fm', 'png');
        const imageResponse = await fetch(ogUrlObj.toString());
        
        if (!imageResponse.ok) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to fetch OG image',
            });
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        setHeader(event, 'Content-Type', 'image/png');
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
