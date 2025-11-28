export const generateOgImageUrl = (title: string) => {
    const baseImageURL = 'https://images.microcms-assets.io/assets/3aba23b5bd6f4b79800a0305d0e4f8aa/0e80c5071f0a441c96aa0d1ff525a2ce/og.png/?blend-mode=normal&w=1200&mark-align=center%2Cmiddle&fm=webp&blend64=';
    
    const base64urlEncode = (str: string) => {
        return Buffer.from(str).toString('base64')
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    };

    const titleImageURL = 'https://images.microcms-assets.io/~text?txtsize=60&w=1100&h=350&txt-color=f57aa5&txt-align=left,top&txtfont=Hiragino%20Sans%20W3&fm=webp&txt64=' + base64urlEncode(title);

    return baseImageURL + base64urlEncode(titleImageURL);
};
