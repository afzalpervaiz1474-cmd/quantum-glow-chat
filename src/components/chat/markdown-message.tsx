import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CodeBlock } from "./code-block";

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h1 className="mb-2 mt-4 font-display text-xl font-semibold first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 font-display text-lg font-semibold first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 font-display text-base font-semibold first:mt-0">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-primary/60 pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="scroll-slim my-3 overflow-x-auto rounded-lg border border-glass-border">
              <table className="w-full text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-glass-border px-3 py-2 font-medium">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-border/40 px-3 py-2">{children}</td>,
          code: ({ className, children, ...props }) => {
            const raw = String(children ?? "");
            const match = /language-(\w+)/.exec(className ?? "");
            const isBlock = match !== null || raw.includes("\n");
            if (!isBlock) {
              return (
                <code
                  className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-primary"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock code={raw.replace(/\n$/, "")} language={match?.[1] ?? "text"} />;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
