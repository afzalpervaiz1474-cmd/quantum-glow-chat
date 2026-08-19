import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoredKeys } from "@/lib/ai/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keys: StoredKeys;
  onSave: (keys: StoredKeys) => void;
}

export function SettingsModal({ open, onOpenChange, keys, onSave }: Props) {
  const [draft, setDraft] = useState(keys);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (open) setDraft(keys);
  }, [open, keys]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-lg border-glass-border sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <KeyRound className="size-4 text-primary" />
            API credentials
          </DialogTitle>
          <DialogDescription>
            Optional. Leave empty to use the built-in managed AI keys. Your own keys stay in this
            browser and are sent per-request over request headers only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API key</Label>
            <Input
              id="openai-key"
              type={reveal ? "text" : "password"}
              placeholder="sk-..."
              autoComplete="off"
              value={draft.openai}
              onChange={(e) => setDraft((d) => ({ ...d, openai: e.target.value }))}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google Gemini API key</Label>
            <Input
              id="gemini-key"
              type={reveal ? "text" : "password"}
              placeholder="AIza..."
              autoComplete="off"
              value={draft.gemini}
              onChange={(e) => setDraft((d) => ({ ...d, gemini: e.target.value }))}
              className="font-mono text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {reveal ? "Hide keys" : "Show keys"}
          </button>

          <p className="flex items-start gap-2 rounded-lg border border-glass-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Keys are never written to the server, logged, or shared between sessions. Automatic
            fallback keeps chatting if one provider is unavailable.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            Save credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
