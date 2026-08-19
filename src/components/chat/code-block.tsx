import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

let highlighterPromise: Promise<import("shiki").Highlighter> | null = null;

const LANGS = [
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "json",
  "bash",
  "python",
  "sql",
  "html",
  "css",
  "markdown",
  "go",
  "rust",
  "java",
] as const;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((shiki) =>
      shiki.createHighlighter({ themes: ["night-owl"], langs: [...LANGS] }),
    );
  }
  return highlighterPromise;
}

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const lang = (LANGS as readonly string[]).includes(language) ? language : "text";

  useEffect(() => {
    let active = true;
    if (lang === "text") {
      setHtml(null);
      return;
    }
    getHighlighter()
      .then((hl) => {
        if (!active) return;
        setHtml(hl.codeToHtml(code, { lang, theme: "night-owl" }));
      })
      .catch(() => setHtml(null));
    return () => {
      active = false;
    };
  }, [code, lang]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-glass-border bg-background/70">
      <div className="flex items-center justify-between border-b border-glass-border px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {html ? (
        <div
          className="scroll-slim overflow-x-auto p-3 text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:font-mono"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="scroll-slim overflow-x-auto p-3 font-mono text-[13px] leading-relaxed text-foreground">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
