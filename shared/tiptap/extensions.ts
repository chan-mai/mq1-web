import { Mark, Node, mergeAttributes } from '@tiptap/core';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Heading } from '@tiptap/extension-heading';
import { TableKit } from '@tiptap/extension-table';
import { StarterKit } from '@tiptap/starter-kit';

// 既存記事のアンカ互換のためid属性を保持
export const CmsHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('id'),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.id ? { id: attributes.id } : {},
      },
    };
  },
}).configure({ levels: [1, 2, 3, 4] });

// zeed-dom(@tiptap/html)互換のためclass属性文字列を直接解析
const readClassNames = (element: Element | null): string[] =>
  (element?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const parseCodeLanguage = (element: HTMLElement): string | null => {
  const code = element.querySelector('code');
  const classNames = [...readClassNames(code), ...readClassNames(element)];
  for (const className of classNames) {
    if (className.startsWith('language-')) return className.slice(9);
    if (className.startsWith('lang-')) return className.slice(5);
  }
  return (
    code?.getAttribute('data-language') ??
    element.getAttribute('data-language') ??
    null
  );
};

// mermaidはlanguage規約で表現
export const CmsCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: null,
        parseHTML: parseCodeLanguage,
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.language
            ? { class: `language-${attributes.language}` }
            : {},
      },
      filename: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-filename'),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.filename ? { 'data-filename': attributes.filename } : {},
      },
    };
  },
});

export const CmsImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      caption: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        getAttrs: (element: HTMLElement) => {
          const img = element.querySelector('img');
          if (!img?.getAttribute('src')) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            caption:
              element.querySelector('figcaption')?.textContent?.trim() || null,
            width: img.getAttribute('width'),
            height: img.getAttribute('height'),
          };
        },
      },
      {
        tag: 'img[src]',
        getAttrs: (element: HTMLElement) => ({
          src: element.getAttribute('src'),
          alt: element.getAttribute('alt'),
          width: element.getAttribute('width'),
          height: element.getAttribute('height'),
        }),
      },
    ];
  },

  renderHTML({ node }) {
    const img = [
      'img',
      mergeAttributes({
        src: node.attrs.src,
        alt: node.attrs.alt,
        width: node.attrs.width,
        height: node.attrs.height,
      }),
    ];
    if (!node.attrs.caption) return ['figure', img];
    return ['figure', img, ['figcaption', {}, String(node.attrs.caption)]];
  },
});

// ドパガキグラデーション装飾
export const Dpgk = Mark.create({
  name: 'dpgk',

  parseHTML() {
    return [{ tag: 'span[data-dpgk]' }];
  },

  renderHTML() {
    return ['span', { 'data-dpgk': '', class: 'dpgk-text' }, 0];
  },
});

// URL単独行のリンクカード
export const LinkCard = Node.create({
  name: 'linkCard',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-link-card]',
        getAttrs: (element: HTMLElement) => {
          const url = element.getAttribute('data-url');
          if (!url) return false;
          return { url };
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'div',
      { 'data-link-card': '', 'data-url': node.attrs.url },
      ['a', { href: node.attrs.url }, String(node.attrs.url)],
    ];
  },
});

export const cmsStarterKit = StarterKit.configure({
  heading: false,
  codeBlock: false,
  link: {
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    // rel/targetは保存せず表示時に決定(relのnofollowのみ選択制)
    HTMLAttributes: {
      rel: null,
      target: null,
    },
  },
});

export const cmsTableKit = TableKit.configure({
  table: { resizable: false },
});

// エディタ・移行スクリプト・レンダラで共有するスキーマ定義
export const createCmsExtensions = () => [
  cmsStarterKit,
  CmsHeading,
  CmsCodeBlock,
  CmsImage,
  LinkCard,
  Dpgk,
  cmsTableKit,
];
