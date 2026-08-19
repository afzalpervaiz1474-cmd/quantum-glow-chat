import { useCallback, useEffect, useRef, useState } from "react";

import { loadKeys, saveKeys, streamChatCompletion, type StoredKeys } from "@/lib/ai/client";
import type { ChatMessage, ProviderId } from "@/lib/ai/types";

export interface UiMessage extends ChatMessage {
  id: string;
  provider?: ProviderId;
  fallback?: boolean;
  error?: boolean;
}

export type ChatStatus = "idle" | "thinking" | "streaming";

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function useNexusChat() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [provider, setProvider] = useState<ProviderId>("gemini");
  const [keys, setKeys] = useState<StoredKeys>({ openai: "", gemini: "" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setKeys(loadKeys());
  }, []);

  const updateKeys = useCallback((next: StoredKeys) => {
    setKeys(next);
    saveKeys(next);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setStatus("idle");
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || status !== "idle") return;

      const userMessage: UiMessage = { id: newId(), role: "user", content };
      const assistantId = newId();

      // Full history is sent on every turn so the model keeps multi-turn context.
      const history: ChatMessage[] = [
        ...messages.map(({ role, content: c }) => ({ role, content: c })),
        { role: "user" as const, content },
      ];

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setStatus("thinking");

      const controller = new AbortController();
      abortRef.current = controller;

      const patch = (updater: (msg: UiMessage) => UiMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? updater(m) : m)));

      try {
        await streamChatCompletion({
          provider,
          messages: history,
          keys,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === "meta") {
              setStatus("streaming");
              patch((m) => ({ ...m, provider: event.provider, fallback: event.fallback }));
            } else if (event.type === "delta" && event.text) {
              setStatus("streaming");
              patch((m) => ({ ...m, content: m.content + event.text }));
            } else if (event.type === "error") {
              patch((m) => ({
                ...m,
                error: true,
                content: m.content
                  ? `${m.content}\n\n**Stream interrupted:** ${event.text}`
                  : `**Error:** ${event.text}`,
              }));
            }
          },
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          patch((m) => ({
            ...m,
            error: true,
            content:
              m.content ||
              `**Error:** ${error instanceof Error ? error.message : "Connection failed"}`,
          }));
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStatus("idle");
      }
    },
    [keys, messages, provider, status],
  );

  return { messages, status, provider, setProvider, keys, updateKeys, send, stop, reset };
}
