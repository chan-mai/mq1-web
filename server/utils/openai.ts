import type { H3Event } from "h3";

interface ChatCompleteOptions {
  system: string;
  user: string;
}

export const chatComplete = async (
  event: H3Event,
  { system, user }: ChatCompleteOptions,
): Promise<string> => {
  const config = useRuntimeConfig(event);
  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "OpenAI API key is not configured",
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiModel || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    console.error("OpenAI API error:", response.status, await response.text());
    throw createError({
      statusCode: 502,
      statusMessage: "OpenAI API request failed",
    });
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw createError({
      statusCode: 502,
      statusMessage: "OpenAI API returned an empty response",
    });
  }
  return content;
};
