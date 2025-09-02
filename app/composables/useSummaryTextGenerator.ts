import * as cheerio from 'cheerio';

export default function useOgGenerator(content: string){
    // Articles.contentからSummaryを生成
    // HTMLをパースしてテキストを取得、150字でトリム
    const $ = cheerio.load(content);
    const textContent: string = $.text().trim();
    return textContent.length > 500
        ? textContent.slice(0, 150)
        : textContent;
}