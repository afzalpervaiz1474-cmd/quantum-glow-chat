import type { ChatMessage, ProviderId, StreamEvent } from "./types";

export type { StreamEvent };

const STORAGE_KEY = "nexus.api-keys.v1";

export interface StoredKeys {
  openai: string;
  gemini: string;
}

export function loadKeys(): StoredKeys {
  if (typeof window === "undefined") return { openai: "", gemini: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { openai: "", gemini: "" };
    const parsed = JSON.parse(raw) as Partial<StoredKeys>;
    return { openai: parsed.openai ?? "", gemini: parsed.gemini ?? "" };
  } catch {
    return { openai: "", gemini: "" };
  }
}

export function saveKeys(keys: StoredKeys) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

/** Opens the SSE stream and invokes `onEvent` for every normalized event. */
export async function streamChatCompletion(opts: {
  provider: ProviderId;
  messages: ChatMessage[];
  keys: StoredKeys;
  signal: AbortSignal;
  onEvent: (event: StreamEvent) => void;
}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.keys.openai.trim()) headers["x-openai-key"] = opts.keys.openai.trim();
  if (opts.keys.gemini.trim()) headers["x-gemini-key"] = opts.keys.gemini.trim();

  const res = await fetch("/api/public/chat", {
    method: "POST",
    headers,
    signal: opts.signal,
    body: JSON.stringify({ provider: opts.provider, messages: opts.messages }),
  });

  if (!res.ok || !res.body) {
    opts.onEvent({ type: "error", text: `Server error (${res.status})` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          opts.onEvent(JSON.parse(payload) as StreamEvent);
        } catch {
          /* ignore malformed frame */
        }
      }
    }
  }
}
