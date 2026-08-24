import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import MqArticleImage from '~/components/mq/ArticleImage.vue';
import MqCodeBlock from '~/components/mq/CodeBlock.vue';
import MqLinkCard from '~/components/mq/LinkCard.vue';
import MqMermaidBlock from '~/components/mq/MermaidBlock.vue';
import MqScrollableTable from '~/components/mq/ScrollableTable.vue';

export interface ArticleRenderContext {
  headingIdFor: (node: TiptapNode) => string;
  onHeadingClick: (id: string) => void;
  siteHosts: string[];
}

const isExternalHref = (href: string, siteHosts: string[]): boolean => {
  if (!/^https?:\/\//.test(href)) return false;
  try {
    return !siteHosts.includes(new URL(href).host);
  } catch {
    return false;
  }
};

const MARK_TAGS: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  strike: 's',
  underline: 'u',
  code: 'code',
};

const textOf = (node: TiptapNode): string => {
  const parts: string[] = [];
  const walk = (child: TiptapNode) => {
    if (child.type === 'text' && child.text) parts.push(child.text);
    child.content?.forEach(walk);
  };
  walk(node);
  return parts.join('');
};

const findLinkMark = (node: TiptapNode) =>
  node.marks?.find((mark) => mark.type === 'link');

const renderTextWithMarks = (
  node: TiptapNode,
  options: { skipLink?: boolean } = {},
): VNodeChild => {
  let rendered: VNodeChild = node.text ?? '';
  for (const mark of node.marks ?? []) {
    if (mark.type === 'link' && options.skipLink) continue;
    if (mark.type === 'dpgk') {
      rendered = h('span', { class: 'dpgk-text' }, [rendered]);
      continue;
    }
    const tag = MARK_TAGS[mark.type];
    if (tag) rendered = h(tag, [rendered]);
  }
  return rendered;
};

const renderInlineNodes = (
  nodes: TiptapNode[],
  ctx: ArticleRenderContext,
): VNodeChild[] => {
  const out: VNodeChild[] = [];
  let index = 0;

  while (index < nodes.length) {
    const node = nodes[index]!;
    const linkMark = node.type === 'text' ? findLinkMark(node) : undefined;

    if (linkMark) {
      const href = String(linkMark.attrs?.href ?? '');
      // 同一リンクの連続テキストを単一aタグに統合
      const group: TiptapNode[] = [];
      while (index < nodes.length) {
        const current = nodes[index]!;
        const currentMark =
          current.type === 'text' ? findLinkMark(current) : undefined;
        if (!currentMark || String(currentMark.attrs?.href ?? '') !== href) {
          break;
        }
        group.push(current);
        index += 1;
      }

      const children: VNodeChild[] = group.map((child) =>
        renderTextWithMarks(child, { skipLink: true }),
      );
      children.push(h('span', { class: 'link-icon' }, '\u{1F517}'));

      // 自サイト以外は別タブで表示
      const external = isExternalHref(href, ctx.siteHosts);
      out.push(
        h(
          'a',
          {
            href,
            target: external ? '_blank' : undefined,
            rel:
              (linkMark.attrs?.rel as string | null) ??
              (external ? 'noopener noreferrer' : undefined),
            class: 'link-with-icon',
          },
          children,
        ),
      );
      continue;
    }

    out.push(renderArticleNode(node, ctx));
    index += 1;
  }

  return out;
};

const renderChildren = (
  node: TiptapNode,
  ctx: ArticleRenderContext,
): VNodeChild[] => renderInlineNodes(node.content ?? [], ctx);

export const renderArticleNode = (
  node: TiptapNode,
  ctx: ArticleRenderContext,
): VNodeChild => {
  switch (node.type) {
    case 'text':
      return renderTextWithMarks(node);
    case 'paragraph':
      return h('p', renderChildren(node, ctx));
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6);
      const id = ctx.headingIdFor(node);
      const children = renderChildren(node, ctx);
      // 先頭#付き見出しへの重複追加防止
      if (!/^#{1,6}\s/.test(textOf(node).trimStart())) {
        children.unshift(
          h(
            'span',
            { class: `heading-level-${level} text-primary/60` },
            '#'.repeat(level),
          ),
          ' ',
        );
      }
      return h(
        `h${level}`,
        {
          id,
          class: 'clickable-heading',
          onClick: () => ctx.onHeadingClick(id),
        },
        children,
      );
    }
    case 'bulletList':
      return h('ul', renderChildren(node, ctx));
    case 'orderedList':
      return h(
        'ol',
        { start: node.attrs?.start as number | undefined },
        renderChildren(node, ctx),
      );
    case 'listItem': {
      // 先頭段落はp化せずインライン展開
      const children = (node.content ?? []).flatMap((child, index) =>
        index === 0 && child.type === 'paragraph'
          ? renderInlineNodes(child.content ?? [], ctx)
          : [renderArticleNode(child, ctx)],
      );
      return h('li', children);
    }
    case 'blockquote':
      return h('blockquote', renderChildren(node, ctx));
    case 'horizontalRule':
      return h('hr');
    case 'hardBreak':
      return h('br');
    case 'codeBlock': {
      const source = textOf(node);
      const language = (node.attrs?.language as string | null) ?? undefined;
      const filename = (node.attrs?.filename as string | null) ?? undefined;
      if (language === 'mermaid') {
        return h(MqMermaidBlock, { source, filename });
      }
      return h(MqCodeBlock, { source, language, filename });
    }
    case 'image':
      return h(MqArticleImage, {
        src: String(node.attrs?.src ?? ''),
        alt: (node.attrs?.alt as string | null) ?? undefined,
        caption: (node.attrs?.caption as string | null) ?? undefined,
        width: (node.attrs?.width as number | string | null) ?? undefined,
        height: (node.attrs?.height as number | string | null) ?? undefined,
      });
    case 'linkCard':
      return h(MqLinkCard, {
        url: String(node.attrs?.url ?? ''),
        class: 'px-3 my-5 md:px-8',
      });
    case 'table':
      return h(MqScrollableTable, null, {
        default: () => [h('table', [h('tbody', renderChildren(node, ctx))])],
      });
    case 'tableRow':
      return h('tr', renderChildren(node, ctx));
    case 'tableHeader':
      return h(
        'th',
        {
          colspan: node.attrs?.colspan as number | undefined,
          rowspan: node.attrs?.rowspan as number | undefined,
        },
        renderChildren(node, ctx),
      );
    case 'tableCell':
      return h(
        'td',
        {
          colspan: node.attrs?.colspan as number | undefined,
          rowspan: node.attrs?.rowspan as number | undefined,
        },
        renderChildren(node, ctx),
      );
    default:
      // 未知ノードは子のみ描画
      return renderChildren(node, ctx);
  }
};

export const ArticleBodyNodes = defineComponent({
  name: 'ArticleBodyNodes',
  props: {
    nodes: {
      type: Array as PropType<TiptapNode[]>,
      required: true,
    },
    ctx: {
      type: Object as PropType<ArticleRenderContext>,
      required: true,
    },
  },
  setup(props) {
    return () => renderInlineNodes(props.nodes, props.ctx);
  },
});
