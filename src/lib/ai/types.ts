export type ChatRole = "user" | "assistant" | "system";

/** An image attached to a chat message, stored as a base64 data URL. */
export interface Attachment {
  name: string;
  mime: string;
  /** `data:<mime>;base64,...` — inlined so the provider never fetches our origin. */
  dataUrl: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  images?: Attachment[] | undefined;
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
  "You are NEXUS, an advanced multimodal AI assistant. " +
  "Answer precisely and helpfully. Use GitHub-flavored markdown, always fence code blocks with the " +
  "correct language tag, and write mathematics as LaTeX between $...$ or $$...$$ delimiters.";

export interface StreamEvent {
  type: "meta" | "delta" | "error" | "done";
  provider?: ProviderId;
  fallback?: boolean;
  text?: string;
}

/** Media produced by the generation endpoints and rendered inside the transcript. */
export interface GeneratedMedia {
  kind: "image" | "video";
  url: string;
  prompt: string;
  mime: string;
}
