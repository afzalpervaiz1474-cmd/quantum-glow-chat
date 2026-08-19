import { AnimatePresence, motion } from "framer-motion";
import { Bot, RotateCcw, Settings2, Sparkle, Square } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { MessageBubble } from "@/components/chat/message-bubble";
import { SettingsModal } from "@/components/chat/settings-modal";
import { Button } from "@/components/ui/button";
import nexusLogo from "@/assets/nexus-logo.png";
import { useNexusChat } from "@/hooks/use-nexus-chat";
import type { ProviderId } from "@/lib/ai/types";
import { cn } from "@/lib/utils";
import type { SceneMode } from "@/components/quantum-scene";

const MODELS: { id: ProviderId; label: string; sub: string }[] = [
  { id: "gemini", label: "Gemini", sub: "1.5 Pro class" },
  { id: "openai", label: "ChatGPT", sub: "GPT-4o class" },
];

const SUGGESTIONS = [
  "Explain quantum entanglement like I'm 12",
  "Write a debounced React hook in TypeScript",
  "Draft a launch tweet for a 3D AI console",
  "Compare SSE and WebSockets for streaming",
];

export function ChatConsole({ onModeChange }: { onModeChange: (mode: SceneMode) => void }) {
  const { messages, status, provider, setProvider, keys, updateKeys, send, stop, reset } =
    useNexusChat();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Keep the 3D scene in sync with the conversation lifecycle.
  useEffect(() => {
    onModeChange(status as SceneMode);
  }, [status, onModeChange]);

  const busy = status !== "idle";

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <img
            src={nexusLogo}
            alt="NEXUS AI console logo"
            width={512}
            height={512}
            className="size-9"
          />
          <div className="leading-tight">
            <h1 className="font-display text-base font-semibold tracking-wide text-glow">
              NEXUS <span className="text-primary">AI</span>
            </h1>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              quantum chat console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-glass-border bg-secondary/40 p-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setProvider(model.id)}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  provider === model.id
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {provider === model.id && (
                  <motion.span
                    layoutId="model-pill"
                    className="absolute inset-0 rounded-lg bg-primary shadow-neon"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{model.label}</span>
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Reset conversation"
            onClick={reset}
            disabled={messages.length === 0}
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="size-4" />
          </Button>
        </div>
      </motion.header>

      {/* Transcript */}
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="glass-panel relative min-h-0 flex-1 overflow-hidden rounded-2xl"
      >
        <Conversation className="h-full">
          <ConversationContent className="scroll-slim space-y-6 px-4 py-6 sm:px-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 py-10 text-center">
                <motion.img
                  src={nexusLogo}
                  alt="NEXUS orb"
                  width={512}
                  height={512}
                  className="size-20"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="space-y-2">
                  <h2 className="font-display text-2xl font-semibold text-glow">
                    Enter the quantum console
                  </h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Streaming answers from Gemini and ChatGPT with automatic failover. Ask anything —
                    the environment reacts as the model thinks.
                  </p>
                </div>
                <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="group rounded-xl border border-glass-border bg-secondary/30 px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:border-ring hover:bg-secondary/60 hover:text-foreground"
                    >
                      <Sparkle className="mb-1.5 size-3.5 text-primary transition-transform group-hover:scale-125" />
                      <span className="block">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message, i) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    streaming={status === "streaming" && i === messages.length - 1}
                  />
                ))}
              </AnimatePresence>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </motion.div>

      {/* Composer */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel rounded-2xl p-2"
      >
        <PromptInput
          onSubmit={(message, event) => {
            event.preventDefault();
            const text = message.text?.trim();
            if (text) void send(text);
          }}
        >
          <PromptInputTextarea
            placeholder={busy ? "NEXUS is responding..." : "Message NEXUS…"}
            disabled={busy}
          />
          <PromptInputFooter className="justify-between">
            <PromptInputTools>
              <span className="inline-flex items-center gap-2 px-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <Bot className="size-3.5 text-primary" />
                {status === "idle" ? "ready" : status}
              </span>
            </PromptInputTools>
            {busy ? (
              <Button type="button" size="icon-sm" variant="secondary" aria-label="Stop" onClick={stop}>
                <Square className="size-3.5" />
              </Button>
            ) : (
              <PromptInputSubmit size="icon-sm" />
            )}
          </PromptInputFooter>
        </PromptInput>
      </motion.div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        keys={keys}
        onSave={updateKeys}
      />
    </div>
  );
}
