import { motion } from "framer-motion";
import { Check, Copy, User, Zap } from "lucide-react";
import { useState } from "react";

import { MarkdownMessage } from "./markdown-message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import nexusLogo from "@/assets/nexus-logo.png";
import { cn } from "@/lib/utils";
import type { UiMessage } from "@/hooks/use-nexus-chat";

const PROVIDER_NAME = { openai: "GPT-4o", gemini: "Gemini 1.5 Pro" } as const;

export function MessageBubble({ message, streaming }: { message: UiMessage; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-glass-border bg-secondary/50">
          <img src={nexusLogo} alt="NEXUS" width={512} height={512} loading="lazy" className="size-6" />
        </div>
      )}

      <div className={cn("max-w-[min(46rem,88%)] space-y-1.5", isUser && "flex flex-col items-end")}>
        {!isUser && (message.provider || message.fallback) && (
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <Zap className="size-3 text-primary" />
            {message.provider ? PROVIDER_NAME[message.provider] : "AI"}
            {message.fallback && (
              <span className="rounded-full border border-glass-border px-2 py-0.5 text-accent">
                fallback
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "relative rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground shadow-neon"
              : "border border-glass-border bg-transparent",
            message.error && "border-destructive/60",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
          ) : message.content ? (
            <MarkdownMessage content={message.content} />
          ) : (
            <Shimmer className="text-sm">Thinking...</Shimmer>
          )}

          {!isUser && streaming && message.content && (
            <span className="ml-1 inline-block h-4 w-[3px] translate-y-0.5 animate-nexus-pulse rounded-full bg-primary align-middle" />
          )}
        </div>

        {message.content && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy message"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          >
            {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {isUser && (
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-glass-border bg-secondary/50">
          <User className="size-4 text-primary" />
        </div>
      )}
    </motion.div>
  );
}
