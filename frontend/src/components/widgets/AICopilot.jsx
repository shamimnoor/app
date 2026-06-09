import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { COPILOT_URL, FOUNDER } from "@/lib/api";

export default function AICopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hi — I'm Noor, ${FOUNDER.name}'s AI copilot. Ask about services, share what you're building, or request a free consult.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const sessionId = useRef(`web-${Math.random().toString(36).slice(2, 10)}`);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }, { role: "assistant", text: "" }]);
    setStreaming(true);

    try {
      const res = await fetch(COPILOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId.current }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          if (!part.startsWith("data:")) continue;
          const data = part.replace(/^data:\s?/, "");
          if (data === "[DONE]") continue;
          const chunk = data.replace(/\\n/g, "\n");
          setMessages((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") last.text += chunk;
            return next;
          });
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I hit an error. Please try again." }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="copilot-toggle-button"
        className="fixed z-50 bottom-6 right-6 w-14 h-14 rounded-full bg-foreground text-background shadow-2xl shadow-black/30 flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open AI Copilot"
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[hsl(var(--accent))] rounded-full pulse-dot" />
        )}
      </button>

      {open && (
        <div
          data-testid="copilot-window"
          className="fixed z-50 bottom-24 right-6 w-[calc(100vw-3rem)] sm:w-[400px] h-[560px] max-h-[80vh] glass rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/40">
            <div className="relative">
              <img src={FOUNDER.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium leading-tight">Noor · AI Copilot</div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-secondary rounded-md" data-testid="copilot-close-button">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-testid="copilot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <img src={FOUNDER.avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1" alt="" />
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-foreground text-background rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.text || (streaming && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="border-t border-border p-3 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              data-testid="copilot-input"
              placeholder="Ask anything…"
              className="flex-1 bg-secondary/60 px-3 py-2 rounded-md text-sm outline-none border border-transparent focus:border-border"
              disabled={streaming}
            />
            <button
              type="submit"
              data-testid="copilot-send-button"
              disabled={streaming || !input.trim()}
              className="w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
