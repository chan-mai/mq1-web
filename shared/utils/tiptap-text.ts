const collectText = (node: TiptapNode, parts: string[]) => {
  if (node.type === "text" && node.text) {
    parts.push(node.text);
  }
  node.content?.forEach((child) => collectText(child, parts));
};

// ブロック単位を改行区切りで連結
export const extractPlainText = (doc: TiptapDoc): string => {
  const blocks: string[] = [];
  for (const node of doc.content ?? []) {
    const parts: string[] = [];
    collectText(node, parts);
    const text = parts.join("");
    if (text) blocks.push(text);
  }
  return blocks.join("\n");
};

// cheerio $.text().trim().length等価
export const countContentCharacters = (doc: TiptapDoc): number => {
  const parts: string[] = [];
  for (const node of doc.content ?? []) {
    collectText(node, parts);
  }
  return parts.join("").trim().length;
};

// 本文テキスト収集
const collectBodyText = (node: TiptapNode, parts: string[]) => {
  if (node.type === "heading") return;
  if (node.type === "text" && node.text) {
    parts.push(node.text);
  }
  node.content?.forEach((child) => collectBodyText(child, parts));
};

// 500字超で先頭150字 サマリ生成
export const generateSummary = (doc: TiptapDoc): string => {
  const parts: string[] = [];
  for (const node of doc.content ?? []) {
    collectBodyText(node, parts);
  }
  const text = parts.join("").trim();
  return text.length > 500 ? text.slice(0, 150) : text;
};

export const parseTiptapDoc = (value: string): TiptapDoc | null => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed as TiptapDoc;
    }
    return null;
  } catch {
    return null;
  }
};

export const emptyTiptapDoc = (): TiptapDoc => ({
  type: "doc",
  content: [],
});
