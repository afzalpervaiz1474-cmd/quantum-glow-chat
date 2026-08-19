import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { streamChat } from "@/lib/ai/stream.server";

const bodySchema = z.object({
  provider: z.enum(["openai", "gemini"]),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(20000),
      }),
    )
    .min(1)
    .max(60),
});

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        // Optional user-supplied keys: never persisted, used per-request only.
        const keys = {
          openai: request.headers.get("x-openai-key") ?? undefined,
          gemini: request.headers.get("x-gemini-key") ?? undefined,
        };

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (data: unknown) =>
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            try {
              for await (const event of streamChat(parsed.provider, parsed.messages, keys)) {
                send(event);
              }
            } catch (error) {
              send({
                type: "error",
                text: error instanceof Error ? error.message : "Unexpected server error",
              });
            } finally {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
