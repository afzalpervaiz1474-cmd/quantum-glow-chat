# Lumina AI

Act as a Principal Full-Stack Developer and 3D UI/UX Engineer. Create a complete, production-ready full-stack web application for an advanced AI Chat Agent that operates like ChatGPT, featuring a stunning 3D/5D interactive visual design built with Three.js.

### 1. Project Requirements & Architecture

#### A. Backend (Node.js / Express or Next.js API Routes):
- API Integration: Support both OpenAI API (GPT-4o) and Google Gemini API (Gemini 1.5 Pro).
- Real-Time Streaming: Use Server-Sent Events (SSE) or WebSockets to stream AI responses token-by-token.
- Dynamic Switching & Fallback: Allow switching between Gemini and ChatGPT dynamically. If the primary API fails, automatically fallback to the other.
- Context & Memory: Maintain conversation history for multi-turn contextual chat sessions.
- Secure API Handling: Store and process API keys securely via environment variables or user input headers.

#### B. Frontend & 3D Visual Experience (Three.js):
- Dynamic 3D Environment: Create an interactive background using Three.js (or @react-three/fiber) featuring a glowing quantum particle mesh or dynamic 3D sphere.
- Reactive 3D Animations: The 3D scene must dynamically respond to chat events (e.g., speed up rotation, pulse neon glow, or change color schemes when the AI is processing/streaming a response).
- 5D Immersion & Interactivity:
  * Mouse Parallax: Subtle 3D perspective shifts based on cursor/touch movement.
  * Micro-Interactions: Smooth UI transitions using Framer Motion.
- UI Design: Futuristic Glassmorphism panel with dark mode, backdrop blur, glowing borders, animated chat bubbles, code syntax highlighting, copy buttons, and a settings modal for API key management.

### 2. Tech Stack Specification
- Frontend: React / Next.js, Tailwind CSS, Three.js (`three`, `@react-three/fiber`, `@react-three/drei`), Framer Motion, Lucide Icons.
- Backend: Node.js, Express (or Next.js Route Handlers), `@google/generative-ai`, `openai`.

### 3. Deliverables Needed
Provide complete, functional, and modular code without placeholders or omitted parts:
1. Complete Directory Structure.
2. Backend API Setup (SSE Streaming, Dual-API Integration, and Fallback logic).
3. Three.js Interactive Scene Component.
4. Full React Chat UI Component (Streaming response renderer, model switcher, API key modal, markdown renderer).

Generate the full code implementation now.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://quantum-glow-chat.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6be27c34-c7ea-4128-bb58-37aaeddc2caf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
