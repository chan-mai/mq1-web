export interface ArticleTocItem {
  id: string;
  text: string;
  level: number;
}

const headingText = (node: TiptapNode): string => {
  const parts: string[] = [];
  const walk = (child: TiptapNode) => {
    if (child.type === 'text' && child.text) parts.push(child.text);
    child.content?.forEach(walk);
  };
  walk(node);
  return parts.join('').trim();
};

// 既存idを優先, 無ければ走査順でheading-{index}
export const resolveHeadingId = (node: TiptapNode, index: number): string => {
  const id = node.attrs?.id;
  if (typeof id === 'string' && id) return id;
  return `heading-${index}`;
};

export const extractToc = (doc: TiptapDoc): ArticleTocItem[] => {
  const toc: ArticleTocItem[] = [];
  let index = 0;

  const walk = (node: TiptapNode) => {
    if (node.type === 'heading') {
      const level = Number(node.attrs?.level ?? 1);
      if (level >= 1 && level <= 4) {
        toc.push({
          id: resolveHeadingId(node, index),
          text: headingText(node),
          level,
        });
        index += 1;
      }
    }
    node.content?.forEach(walk);
  };

  (doc.content ?? []).forEach(walk);
  return toc;
};
