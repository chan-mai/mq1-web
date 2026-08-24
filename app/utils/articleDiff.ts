import { diffArrays } from 'diff';

// 文字+装飾を単位とするリビジョン差分のHTML生成
// トークン形式: C{marks}SEP{char} / B{tag}SEP{class}SEP{prefix} / A{html} / R(改行)
const SEP = '\u0001';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const markSignature = (marks?: TiptapMark[]) =>
  (marks ?? [])
    .map((mark) =>
      mark.type === 'link'
        ? `link:${String(mark.attrs?.href ?? '')}`
        : mark.type,
    )
    .sort()
    .join(',');

const pushChars = (tokens: string[], text: string, marks: string) => {
  for (const char of text) {
    tokens.push(`C${marks}${SEP}${char}`);
  }
};

const pushInline = (tokens: string[], nodes?: TiptapNode[]) => {
  for (const node of nodes ?? []) {
    if (node.type === 'hardBreak') {
      tokens.push('R');
    } else if (node.type === 'text') {
      pushChars(tokens, node.text ?? '', markSignature(node.marks));
    } else {
      pushInline(tokens, node.content);
    }
  }
};

const pushBlock = (
  tokens: string[],
  tag: string,
  className = '',
  prefix = '',
) => {
  tokens.push(`B${tag}${SEP}${className}${SEP}${prefix}`);
};

interface TokenizeContext {
  quote?: boolean;
  listPrefix?: string;
}

const blockClass = (context: TokenizeContext) =>
  [context.quote && 'diff-quote', context.listPrefix && 'diff-li']
    .filter(Boolean)
    .join(' ');

const tokenizeBlocks = (
  tokens: string[],
  nodes: TiptapNode[] | undefined,
  context: TokenizeContext,
) => {
  for (const node of nodes ?? []) {
    switch (node.type) {
      case 'heading': {
        const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6);
        pushBlock(tokens, `h${level}`, blockClass(context));
        pushInline(tokens, node.content);
        break;
      }
      case 'paragraph':
        pushBlock(tokens, 'p', blockClass(context), context.listPrefix ?? '');
        pushInline(tokens, node.content);
        break;
      case 'bulletList':
        for (const item of node.content ?? []) {
          tokenizeBlocks(tokens, item.content, {
            ...context,
            listPrefix: '・',
          });
        }
        break;
      case 'orderedList': {
        let index = Number(node.attrs?.start ?? 1);
        for (const item of node.content ?? []) {
          tokenizeBlocks(tokens, item.content, {
            ...context,
            listPrefix: `${index++}. `,
          });
        }
        break;
      }
      case 'blockquote':
        tokenizeBlocks(tokens, node.content, { ...context, quote: true });
        break;
      case 'codeBlock': {
        const filename = node.attrs?.filename
          ? `${String(node.attrs.filename)}\n`
          : '';
        pushBlock(tokens, 'pre', '', filename);
        pushChars(
          tokens,
          (node.content ?? []).map((child) => child.text ?? '').join(''),
          'cb',
        );
        break;
      }
      case 'image': {
        const src = escapeHtml(String(node.attrs?.src ?? ''));
        const caption = node.attrs?.caption
          ? `<span class="diff-caption">${escapeHtml(String(node.attrs.caption))}</span>`
          : '';
        tokens.push(`A<img src="${src}" alt="" class="diff-img">${caption}`);
        break;
      }
      case 'linkCard':
        tokens.push(
          `A<div class="diff-card">${escapeHtml(String(node.attrs?.url ?? ''))}</div>`,
        );
        break;
      case 'horizontalRule':
        tokens.push('A<hr>');
        break;
      case 'table':
        for (const row of node.content ?? []) {
          pushBlock(tokens, 'p', 'diff-row');
          (row.content ?? []).forEach((cell, cellIndex) => {
            if (cellIndex > 0)
              tokens.push('A<span class="diff-cellsep">｜</span>');
            for (const cellBlock of cell.content ?? []) {
              pushInline(tokens, cellBlock.content);
            }
          });
        }
        break;
      default:
        if (node.content) tokenizeBlocks(tokens, node.content, context);
    }
  }
};

type DiffMode = '' | 'ins' | 'del';

const renderRun = (text: string, marks: string, mode: DiffMode) => {
  let html = escapeHtml(text);
  const markSet = new Set(marks.split(','));
  if (markSet.has('dpgk')) html = `<span class="dpgk-text">${html}</span>`;
  if (markSet.has('code')) html = `<code>${html}</code>`;
  if (markSet.has('strike')) html = `<s>${html}</s>`;
  if (markSet.has('underline')) html = `<u>${html}</u>`;
  if (markSet.has('italic')) html = `<em>${html}</em>`;
  if (markSet.has('bold')) html = `<strong>${html}</strong>`;
  if ([...markSet].some((mark) => mark.startsWith('link:'))) {
    html = `<span class="diff-link">${html}</span>`;
  }
  if (mode === 'ins') return `<ins>${html}</ins>`;
  if (mode === 'del') return `<del>${html}</del>`;
  return html;
};

export const renderArticleDiffHtml = (
  oldDoc: TiptapDoc | null,
  newDoc: TiptapDoc,
): string => {
  const oldTokens: string[] = [];
  const newTokens: string[] = [];
  if (oldDoc) tokenizeBlocks(oldTokens, oldDoc.content, {});
  tokenizeBlocks(newTokens, newDoc.content, {});

  const parts = diffArrays(oldTokens, newTokens);

  let html = '';
  let closeTag = '';
  let runText = '';
  let runMarks: string | null = null;
  let runMode: DiffMode = '';

  const flushRun = () => {
    if (runMarks !== null && runText) {
      html += renderRun(runText, runMarks, runMode);
    }
    runText = '';
    runMarks = null;
  };
  const closeBlock = () => {
    if (closeTag) {
      html += closeTag;
      closeTag = '';
    }
  };

  for (const part of parts) {
    const mode: DiffMode = part.added ? 'ins' : part.removed ? 'del' : '';
    for (const token of part.value) {
      const kind = token[0];
      if (kind === 'C') {
        const separatorIndex = token.indexOf(SEP);
        const marks = token.slice(1, separatorIndex);
        const char = token.slice(separatorIndex + 1);
        if (runMarks !== marks || runMode !== mode) {
          flushRun();
          runMarks = marks;
          runMode = mode;
        }
        runText += char;
      } else if (kind === 'B') {
        flushRun();
        closeBlock();
        const [tag, className, prefix] = token.slice(1).split(SEP);
        html += `<${tag}${className ? ` class="${className}"` : ''}>`;
        if (prefix) {
          html += `<span class="diff-prefix">${escapeHtml(prefix)}</span>`;
        }
        closeTag = `</${tag}>`;
      } else if (kind === 'R') {
        flushRun();
        html += '<br>';
      } else if (kind === 'A') {
        flushRun();
        const atom = token.slice(1);
        if (mode === 'ins') html += `<ins class="diff-atom">${atom}</ins>`;
        else if (mode === 'del') html += `<del class="diff-atom">${atom}</del>`;
        else html += atom;
      }
    }
  }
  flushRun();
  closeBlock();
  return html;
};
