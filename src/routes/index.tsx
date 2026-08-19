import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useState } from "react";

import { ChatConsole } from "@/components/chat/chat-console";
import type { SceneMode } from "@/components/quantum-scene";

const title = "NEXUS AI — 3D Quantum Chat Console";
const description =
  "A futuristic AI chat agent with token-by-token streaming, Gemini and ChatGPT switching with automatic failover, inside a reactive 3D quantum environment.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// Three.js must not evaluate during SSR — load the scene after hydration.
const QuantumScene = lazy(() =>
  import("@/components/quantum-scene").then((m) => ({ default: m.QuantumScene })),
);

function Index() {
  const [mode, setMode] = useState<SceneMode>("idle");
  const onModeChange = useCallback((next: SceneMode) => setMode(next), []);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <Suspense fallback={<div className="fixed inset-0 -z-10 bg-background" />}>
        <QuantumScene mode={mode} />
      </Suspense>
      <ChatConsole onModeChange={onModeChange} />
    </main>
  );
}
