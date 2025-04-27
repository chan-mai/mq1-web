function base64urlEncode(source: string){
    const textEncoder = new TextEncoder();
    const encodeString = (string: string | undefined) => textEncoder.encode(string);

    const decodeBinaryString = (uint8Array: any) => uint8Array.reduce(
        (binaryString: string, uint8: number) => binaryString + String.fromCharCode(uint8),
        '',
    );
    const uint8Array = encodeString(source);
    const binaryString = decodeBinaryString(uint8Array);
    const base64 = btoa(binaryString);

    return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export default function useOgGenerator(title: string){
    const baseImageURL: string = 'https://images.microcms-assets.io/assets/3aba23b5bd6f4b79800a0305d0e4f8aa/e765f37291d84fe7a1417a1825737e73/og-image.png/?blend-mode=normal&w=1200&mark-align=center%2Cmiddle&blend64=';
    let titleImageURL: string = 'https://images.microcms-assets.io/~text?txtsize=48&txt-x=43&txt-y=100&w=1100&h=590&txt-color=FFABBF&txt-align=left,middle&txtfont=Hiragino%20Sans%20W6&txt64='+base64urlEncode(title);

    const url = baseImageURL + base64urlEncode(titleImageURL);
    return url;
}