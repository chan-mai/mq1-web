import { chatComplete } from "~~/server/utils/openai";

const MAX_TEXT_LENGTH = 8000;

export default defineEventHandler(async (event) => {
  const body = await readBody<{ text?: string }>(event);
  const text = body?.text?.trim();

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: "Text is required" });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw createError({ statusCode: 413, statusMessage: "Text too long" });
  }

  const corrected = await chatComplete(event, {
    system:
      "あなたは日本語の校正者です。入力された文章の誤字脱字・文法・表記の誤りのみを修正し、修正後の全文だけを出力してください。文体や意味は変えないでください。修正点がない場合は入力をそのまま出力してください。",
    user: text,
  });

  return { corrected };
});
