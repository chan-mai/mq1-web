import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const URL_ONLY_PATTERN = /^https?:\/\/\S+$/;

// URL単独段落を記事表示と同条件でリンクカード化
export const LinkCardPaste = Extension.create({
  name: "linkCardPaste",

  addProseMirrorPlugins() {
    return [
      // 空段落へのURL単独ペーストは即時変換
      new Plugin({
        key: new PluginKey("linkCardPaste"),
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData("text/plain")?.trim();
            if (!text || !URL_ONLY_PATTERN.test(text)) return false;

            const { state } = view;
            const { $from, empty } = state.selection;
            const parent = $from.parent;
            const inEmptyParagraph =
              empty &&
              parent.type.name === "paragraph" &&
              parent.content.size === 0;
            if (!inEmptyParagraph) return false;

            const nodeType = state.schema.nodes.linkCard;
            if (!nodeType) return false;
            const node = nodeType.createAndFill({ url: text });
            if (!node) return false;

            view.dispatch(
              state.tr.replaceRangeWith($from.before(), $from.after(), node),
            );
            return true;
          },
        },
      }),
      // カーソルが離れたURL単独段落を変換(手入力・autolink経由)
      new Plugin({
        key: new PluginKey("linkCardConvert"),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => transaction.docChanged)) {
            return null;
          }
          const linkCardType = newState.schema.nodes.linkCard;
          if (!linkCardType) return null;

          const cursor = newState.selection.from;
          const candidates: { pos: number; size: number; url: string }[] = [];

          newState.doc.descendants((node, pos) => {
            if (node.type.name !== "paragraph") return true;
            const text = node.textContent.trim();
            if (!URL_ONLY_PATTERN.test(text)) return false;
            // 編集中の段落は対象外
            if (cursor >= pos && cursor <= pos + node.nodeSize) return false;
            candidates.push({ pos, size: node.nodeSize, url: text });
            return false;
          });

          if (candidates.length === 0) return null;

          const tr = newState.tr;
          for (const candidate of candidates.reverse()) {
            tr.replaceRangeWith(
              candidate.pos,
              candidate.pos + candidate.size,
              linkCardType.create({ url: candidate.url }),
            );
          }
          return tr;
        },
      }),
    ];
  },
});
