import React, { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Terminal } from "lucide-react";

const SUGGESTIONS = [
  "Show leads",
  "Show active projects",
  "Show analytics",
  "Create blog post about scaling automation",
  "Draft proposal for an agency operating system",
  "Generate service recommendations for a 5-person SaaS",
];

export default function CommandCenter() {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);

  const run = async (override) => {
    const p = (override ?? prompt).trim();
    if (!p) return;
    setBusy(true);
    setHistory((h) => [...h, { role: "user", text: p }]);
    setPrompt("");
    try {
      const res = await api.post("/admin/command", { prompt: p });
      setHistory((h) => [...h, { role: "assistant", intent: res.data.intent, result: res.data.result, message: res.data.message }]);
    } catch {
      setHistory((h) => [...h, { role: "assistant", text: "Something went wrong." }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8" data-testid="dashboard-command">
      <div>
        <div className="label-mono">Command Center</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Natural-language control</h1>
        <p className="text-sm text-muted-foreground mt-1">Type a command or question. The OS will route it to the right action.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => run(s)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/40 hover:bg-secondary transition-colors" data-testid={`suggestion-${s.toLowerCase().replace(/\s+/g, "-")}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {history.map((h, i) => (
          <div key={i} className={`rounded-2xl border border-border p-5 ${h.role === "user" ? "bg-secondary/30" : "bg-card"}`} data-testid={`cmd-history-${i}`}>
            <div className="flex items-center gap-2 label-mono mb-3">
              {h.role === "user" ? <Terminal className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />}
              {h.role === "user" ? "You" : `Noor · ${h.intent || "chat"}`}
            </div>
            {h.role === "user" ? (
              <div className="text-sm font-mono">{h.text}</div>
            ) : (
              <div>
                {h.message && <div className="text-sm font-medium mb-3">{h.message}</div>}
                {typeof h.result === "string" ? (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">{h.result}</pre>
                ) : Array.isArray(h.result) ? (
                  <div className="space-y-2">
                    {h.result.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                        <div className="font-medium">{item.title || item.name || item.client_name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{item.summary || item.email || JSON.stringify(item).slice(0, 100)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs font-mono">{JSON.stringify(h.result, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="sticky bottom-6">
        <div className="rounded-2xl border border-border bg-card p-3 flex gap-2 shadow-2xl">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(); } }}
            placeholder="Try: Create blog post about retention systems…"
            className="resize-none min-h-[60px] border-0 focus-visible:ring-0"
            data-testid="command-input"
          />
          <Button type="submit" disabled={busy || !prompt.trim()} size="lg" data-testid="command-submit">
            {busy ? "Thinking…" : <><Send className="w-4 h-4 mr-1.5" />Run</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
