export default async function useSummaryTextGenerator(contentId: string){
    // api/summarize-article/[contentId].get.ts を呼び出す
    const { data: summary } = await useFetch(`/api/summarize-article/${contentId}`);
    return summary.value.body;
}