import { linkuAiConfig } from "./config";
import { linkuAiLogger } from "./logger";

export type OpenRouterMessage = { role: "system" | "user" | "assistant"; content: string };

export async function openRouterChat(
  messages: OpenRouterMessage[],
  options?: { model?: string; maxTokens?: number }
): Promise<string> {
  const apiKey = linkuAiConfig.openRouter.apiKey;
  if (!apiKey) {
    linkuAiLogger.warn("OPENROUTER_API_KEY not set");
    throw new Error("OpenRouter API key not configured");
  }

  const model = options?.model ?? linkuAiConfig.openRouter.defaultModel;
  const url = `${linkuAiConfig.openRouter.baseUrl}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 2048,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    linkuAiLogger.error("OpenRouter API error", { status: res.status, body: text.slice(0, 500) });
    throw new Error(`OpenRouter API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    error?: { message?: string };
  };

  if (data.error?.message) throw new Error(data.error.message);
  const content = data.choices?.[0]?.message?.content?.trim();
  if (content == null) throw new Error("Empty response from OpenRouter");
  return content;
}

/**
 * Call OpenRouter and parse JSON from the response (strips markdown code blocks if present).
 */
export async function openRouterJson<T>(
  messages: OpenRouterMessage[],
  options?: { model?: string }
): Promise<T> {
  const raw = await openRouterChat(messages, { ...options, maxTokens: 4096 });
  let jsonStr = raw;
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) jsonStr = codeBlock[1].trim();
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    linkuAiLogger.error("OpenRouter JSON parse failed", { raw: raw.slice(0, 300) });
    throw new Error("Invalid JSON from AI response");
  }
}
