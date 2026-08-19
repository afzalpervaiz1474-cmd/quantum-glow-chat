export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ProviderId = "openai" | "gemini";

export interface ProviderKeys {
  openai?: string | undefined;
  gemini?: string | undefined;
}

export interface StreamRequest {
  messages: ChatMessage[];
  provider: ProviderId;
  keys?: ProviderKeys;
}

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: "ChatGPT (GPT-4o class)",
  gemini: "Gemini 1.5 Pro class",
};

export const SYSTEM_PROMPT =
  "You are NEXUS, an advanced AI assistant rendered inside a futuristic 3D interface. " +
  "Answer precisely and helpfully. Use GitHub-flavored markdown, and always fence code blocks with the correct language tag.";

export interface StreamEvent {
  type: "meta" | "delta" | "error" | "done";
  provider?: ProviderId;
  fallback?: boolean;
  text?: string;
}
