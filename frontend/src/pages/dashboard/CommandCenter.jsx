import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Terminal, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { listAgents, runAgent } from "@/lib/agents";
import { listWorkflows, runWorkflow } from "@/lib/workflows";

const SUGGESTIONS = [
  "Draft a 30-day launch plan for the Founder OS service.",
  "Write three headline variants for the Automation Architecture page.",
  "Stress-test our pricing tiers as the CFO.",
  "Design a kickoff plan for a new agency client.",
  "Architect a system for booking discovery calls + payment.",
];

export default function CommandCenter() {
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [target, setTarget] = useState({ kind: "agent", id: "ceo" });
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [ag, wf] = await Promise.all([listAgents({ activeOnly: true }), listWorkflows({ activeOnly: true })]);
        setAgents(ag);
        setWorkflows(wf);
        if (ag.length && !ag.find((a) => a.id === target.id)) setTarget({ kind: "agent", id: ag[0].id });
      } catch (e) {
        toast.error(`Brain unavailable: ${e.message}. Did you run the new migrations?`);
      }
    })();
    // eslint-disable-next-line
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history.length, busy]);

  const run = async (override) => {
    const p = (override ?? prompt).trim();
    if (!p) return;
    setBusy(true);
    setHistory((h) => [...h, { role: "user", text: p }]);
    setPrompt("");
    try {
      if (target.kind === "agent") {
        const agent = agents.find((a) => a.id === target.id);
        if (!agent) throw new Error("Agent not found");
        const { output } = await runAgent({ agent, userMessage: p, useBrain: true });
        setHistory((h) => [...h, { role: "assistant", agent, text: output }]);
      } else {
        const wf = workflows.find((w) => w.id === target.id);
        if (!wf) throw new Error("Workflow not found");
        const steps = [];
        setHistory((h) => [...h, { role: "assistant", workflow: wf, steps: [], pending: true }]);
        const idx = history.length + 1; // index of the assistant block we just added
        await runWorkflow({
          workflow: wf,
          input: p,
          onStep: (s) => {
            steps.push(s);
            setHistory((h) => h.map((x, i) => i === idx ? { ...x, steps: [...steps], pending: true } : x));
          },
        });
        setHistory((h) => h.map((x, i) => i === idx ? { ...x, steps: [...steps], pending: false } : x));
      }
    } catch (e) {
      setHistory((h) => [...h, { role: "assistant", text: `⚠️ ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const targetLabel = (() => {
    if (target.kind === "agent") {
      const a = agents.find((x) => x.id === target.id);
      return a ? `${a.emoji || "🤖"} ${a.name}` : "Pick agent";
    }
    const w = workflows.find((x) => x.id === target.id);
    return w ? `🧠 ${w.name}` : "Pick workflow";
  })();

  return (
    <div className="space-y-6" data-testid="dashboard-command">
      <div>
        <div className="label-mono">Command Center</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Natural-language control</h1>
        <p className="text-sm text-muted-foreground mt-1">Route any request to a single agent or a multi-agent workflow. Memory + Knowledge base are mixed in automatically.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center gap-3" data-testid="command-target-bar">
        <div className="text-xs text-muted-foreground">Route to:</div>
        <div className="relative">
          <details className="group">
            <summary className="list-none cursor-pointer px-3 py-1.5 rounded-md border border-border bg-secondary/40 text-sm flex items-center gap-2" data-testid="command-target-button">
              {targetLabel} <ChevronDown className="w-3.5 h-3.5" />
            </summary>
            <div className="absolute z-10 mt-1 w-72 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-xl p-1" data-testid="command-target-menu">
              <div className="label-mono px-2 pt-2 pb-1">Agents</div>
              {agents.map((a) => (
                <button key={a.id} type="button" onClick={() => setTarget({ kind: "agent", id: a.id })} className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-secondary/60 flex items-center gap-2" data-testid={`command-target-agent-${a.id}`}>
                  <span>{a.emoji || "🤖"}</span><span className="truncate">{a.name}</span>
                </button>
              ))}
              {workflows.length > 0 && <>
                <div className="label-mono px-2 pt-3 pb-1">Workflows</div>
                {workflows.map((w) => (
                  <button key={w.id} type="button" onClick={() => setTarget({ kind: "workflow", id: w.id })} className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-secondary/60" data-testid={`command-target-workflow-${w.id}`}>
                    🧠 {w.name}
                  </button>
                ))}
              </>}
            </div>
          </details>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => run(s)} className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-secondary/30 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" data-testid={`suggestion-${s.slice(0, 12).toLowerCase().replace(/\s+/g, "-")}`}>
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
              {h.role === "user" ? "You" : h.workflow ? `Workflow · ${h.workflow.name}` : `Noor · ${h.agent?.name || "Agent"}`}
            </div>
            {h.role === "user" ? (
              <div className="text-sm whitespace-pre-wrap">{h.text}</div>
            ) : h.workflow ? (
              <div className="space-y-3">
                {(h.steps || []).map((s, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-secondary/20 p-3">
                    <div className="label-mono mb-2">Step {idx + 1} · {s.agent_emoji} {s.agent_name}</div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{s.output}</div>
                  </div>
                ))}
                {h.pending && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running next step…</div>
                )}
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{h.text}</div>
            )}
          </div>
        ))}
        {busy && (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="sticky bottom-6">
        <div className="rounded-2xl border border-border bg-card p-3 flex gap-2 shadow-2xl">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(); } }}
            placeholder={`Send to ${targetLabel}…`}
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
