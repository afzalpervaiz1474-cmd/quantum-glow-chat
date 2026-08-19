import type { ChatMessage, ProviderId, ProviderKeys, StreamEvent } from "./types";
import { SYSTEM_PROMPT } from "./types";

export type { StreamEvent };

/**
 * Normalized text-delta stream for a provider.
 * Each provider adapter yields plain text fragments.
 */
export type TextStream = AsyncGenerator<string, void, unknown>;

export const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const GATEWAY_MODEL: Record<ProviderId, string> = {
  openai: "openai/gpt-5.5",
  gemini: "google/gemini-3.7-flash",
};

export class ProviderError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/** Reads an SSE body and yields each `data:` payload as a raw string. */
async function* sseData(res: Response): AsyncGenerator<string, void, unknown> {
  if (!res.body) throw new ProviderError("Empty response body from provider", 502);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      yield payload;
    }
  }
}

export async function assertOk(res: Response, label: string) {
  if (res.ok) return;
  const detail = await res.text().catch(() => "");
  if (res.status === 429) {
    throw new ProviderError(`${label}: rate limit reached. Please retry shortly.`, 429);
  }
  if (res.status === 402) {
    throw new ProviderError(`${label}: usage credits exhausted.`, 402);
  }
  throw new ProviderError(
    `${label} failed (${res.status}): ${detail.slice(0, 400) || "unknown error"}`,
    res.status,
  );
}

/** Chat-completions message shape, with vision blocks when images are attached. */
function toChatCompletionsMessages(messages: ChatMessage[]) {
  return messages.map((m) => {
    if (!m.images?.length) return { role: m.role, content: m.content };
    return {
      role: m.role,
      content: [
        ...(m.content ? [{ type: "text", text: m.content }] : []),
        ...m.images.map((img) => ({ type: "image_url", image_url: { url: img.dataUrl } })),
      ],
    };
  });
}

/** OpenAI-compatible chat completions stream (Lovable gateway + OpenAI direct). */
async function* chatCompletionsStream(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  label: string,
): TextStream {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...toChatCompletionsMessages(messages),
      ],
    }),
  });
  await assertOk(res, label);

  for await (const payload of sseData(res)) {
    try {
      const json = JSON.parse(payload);
      const delta: string | undefined = json?.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    } catch {
      /* ignore keep-alive / partial frames */
    }
  }
}

/** Lovable AI Gateway Responses API stream (used for OpenAI models). */
async function* gatewayResponsesStream(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): TextStream {
  const res = await fetch(`${GATEWAY}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      store: false,
      instructions: SYSTEM_PROMPT,
      input: messages.map((m) => ({
        role: m.role,
        content: [
          { type: m.role === "assistant" ? "output_text" : "input_text", text: m.content },
          // Vision input is only valid on user/system items.
          ...(m.role === "assistant"
            ? []
            : (m.images ?? []).map((img) => ({
                type: "input_image",
                image_url: img.dataUrl,
              }))),
        ],
      })),
    }),
  });
  await assertOk(res, "OpenAI");

  for await (const payload of sseData(res)) {
    try {
      const json = JSON.parse(payload);
      if (json?.type === "response.output_text.delta" && typeof json.delta === "string") {
        yield json.delta;
      }
    } catch {
      /* ignore */
    }
  }
}

/** Google Gemini native streaming endpoint (used with a user-supplied key). */
async function* geminiDirectStream(apiKey: string, messages: ChatMessage[]): TextStream {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [
          { text: m.content },
          ...(m.images ?? []).map((img) => ({
            inlineData: { mimeType: img.mime, data: img.dataUrl.split(",")[1] ?? "" },
          })),
        ],
      })),
    }),
  });
  await assertOk(res, "Gemini");

  for await (const payload of sseData(res)) {
    try {
      const json = JSON.parse(payload);
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) if (typeof part?.text === "string") yield part.text;
    } catch {
      /* ignore */
    }
  }
}

function streamFor(provider: ProviderId, messages: ChatMessage[], keys: ProviderKeys): TextStream {
  const userKey = provider === "openai" ? keys.openai : keys.gemini;

  if (userKey) {
    return provider === "openai"
      ? chatCompletionsStream(
          "https://api.openai.com/v1/chat/completions",
          userKey,
          "gpt-4o",
          messages,
          "OpenAI",
        )
      : geminiDirectStream(userKey, messages);
  }

  const gatewayKey = process.env["LOVABLE_API_KEY"];
  if (!gatewayKey) {
    throw new ProviderError("No AI credentials available. Add your own API key in Settings.", 401);
  }

  return provider === "openai"
    ? gatewayResponsesStream(gatewayKey, GATEWAY_MODEL.openai, messages)
    : chatCompletionsStream(
        `${GATEWAY}/chat/completions`,
        gatewayKey,
        GATEWAY_MODEL.gemini,
        messages,
        "Gemini",
      );
}

/**
 * Streams the answer from the requested provider, transparently falling back to
 * the other provider if the primary fails before emitting any token.
 */
export async function* streamChat(
  provider: ProviderId,
  messages: ChatMessage[],
  keys: ProviderKeys,
): AsyncGenerator<StreamEvent, void, unknown> {
  const order: ProviderId[] = provider === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
  let lastError: unknown = null;

  for (let i = 0; i < order.length; i++) {
    const current = order[i]!;
    let emitted = false;
    try {
      const stream = streamFor(current, messages, keys);
      for await (const chunk of stream) {
        if (!emitted) {
          emitted = true;
          yield { type: "meta", provider: current, fallback: i > 0 };
        }
        yield { type: "delta", text: chunk };
      }
      if (!emitted) {
        yield { type: "meta", provider: current, fallback: i > 0 };
      }
      yield { type: "done" };
      return;
    } catch (error) {
      lastError = error;
      if (emitted) {
        yield {
          type: "error",
          text: error instanceof Error ? error.message : "Stream interrupted",
        };
        yield { type: "done" };
        return;
      }
      // otherwise: loop and try the fallback provider
    }
  }

  yield {
    type: "error",
    text: lastError instanceof Error ? lastError.message : "All AI providers failed",
  };
  yield { type: "done" };
}
