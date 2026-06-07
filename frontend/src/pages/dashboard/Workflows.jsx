/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Workflow, Play, Loader2, Plus, Trash2, ArrowRight, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { listWorkflows, createWorkflow, deleteWorkflow, runWorkflow, listRuns } from "@/lib/workflows";
import { listAgents } from "@/lib/agents";

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ws, ag] = await Promise.all([listWorkflows(), listAgents({ activeOnly: true })]);
      setWorkflows(ws);
      setAgents(ag);
      if (!selectedId && ws[0]) setSelectedId(ws[0].id);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const selected = workflows.find((w) => w.id === selectedId);

  return (
    <div className="space-y-6" data-testid="dashboard-workflows">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="label-mono flex items-center gap-2"><Workflow className="w-3 h-3" /> Multi-Agent Workflows</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Chain agents into pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Route a single input through multiple specialised agents. Each step sees the previous output.
          </p>
        </div>
        <NewWorkflowDialog agents={agents} onCreated={load} />
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="rounded-2xl border border-border bg-card p-2 max-h-[70vh] overflow-y-auto" data-testid="workflows-list">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</div>
          ) : workflows.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No workflows yet.</div>
          ) : workflows.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedId === w.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}
              data-testid={`workflow-pick-${w.id}`}
            >
              <div className="font-display font-semibold text-foreground">{w.name}</div>
              <div className="text-[11px] text-muted-foreground line-clamp-1">{(w.steps || []).length} steps · {w.slug}</div>
            </button>
          ))}
        </div>

        <div className="space-y-5 min-w-0">
          {selected ? <WorkflowRunner workflow={selected} agents={agents} onChanged={load} /> : (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Select a workflow</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
function WorkflowRunner({ workflow, agents, onChanged }) {
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([]);
  const [runs, setRuns] = useState([]);

  useEffect(() => { setProgress([]); listRuns(workflow.id, 5).then(setRuns).catch(() => {}); }, [workflow.id]);

  const run = async () => {
    if (!input.trim()) return;
    setProgress([]);
    setRunning(true);
    try {
      await runWorkflow({
        workflow,
        input: input.trim(),
        onStep: (step) => setProgress((p) => [...p, step]),
      });
      toast.success("Workflow completed");
      const fresh = await listRuns(workflow.id, 5);
      setRuns(fresh);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete workflow "${workflow.name}"?`)) return;
    try { await deleteWorkflow(workflow.id); toast.success("Deleted"); onChanged(); }
    catch (e) { toast.error(e.message); }
  };

  const agentName = (id) => agents.find((a) => a.id === id)?.name || id;
  const agentEmoji = (id) => agents.find((a) => a.id === id)?.emoji || "🤖";

  return (
    <div className="space-y-5" data-testid="workflow-detail">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">{workflow.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
          </div>
          <button onClick={remove} className="text-muted-foreground hover:text-rose-500" data-testid="workflow-delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2" data-testid="workflow-steps-preview">
          {(workflow.steps || []).map((s, i) => (
            <React.Fragment key={i}>
              <span className="px-2.5 py-1 rounded-full bg-secondary/60 text-xs flex items-center gap-1.5">
                {agentEmoji(s.agent_id)} {agentName(s.agent_id)}
              </span>
              {i < workflow.steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <Label>Input</Label>
        <Textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What should the chain work on? E.g. 'Design a launch plan for our new AI Copilot service.'"
          data-testid="workflow-input"
        />
        <div className="flex justify-end mt-3">
          <Button onClick={run} disabled={running || !input.trim()} data-testid="workflow-run-button">
            {running ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Running…</> : <><Play className="w-4 h-4 mr-1.5" /> Run workflow</>}
          </Button>
        </div>
      </div>

      {progress.length > 0 && (
        <div className="space-y-3" data-testid="workflow-progress">
          {progress.map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 label-mono mb-2">
                <Sparkles className="w-3 h-3" /> Step {i + 1} · {s.agent_emoji} {s.agent_name}
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{s.output}</div>
            </div>
          ))}
        </div>
      )}

      {runs.length > 0 && (
        <div className="space-y-2">
          <div className="label-mono">Recent runs</div>
          {runs.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card/50 p-3 text-xs text-muted-foreground flex items-center justify-between">
              <div className="truncate flex-1 mr-2">{r.input}</div>
              <Badge variant={r.status === "completed" ? "secondary" : r.status === "failed" ? "destructive" : "outline"}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
function NewWorkflowDialog({ agents, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", steps: [{ agent_id: "", instructions: "" }] });

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateStep = (i, patch) => setForm((f) => ({ ...f, steps: f.steps.map((s, j) => j === i ? { ...s, ...patch } : s) }));
  const addStep = () => setForm((f) => ({ ...f, steps: [...f.steps, { agent_id: "", instructions: "" }] }));
  const removeStep = (i) => setForm((f) => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    const steps = form.steps.filter((s) => s.agent_id);
    if (steps.length === 0) return toast.error("Add at least one step with an agent.");
    try {
      await createWorkflow({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
        description: form.description,
        steps,
      });
      toast.success("Workflow created");
      setOpen(false);
      setForm({ name: "", slug: "", description: "", steps: [{ agent_id: "", instructions: "" }] });
      onCreated();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="workflow-new-button"><Plus className="w-4 h-4 mr-1.5" /> New workflow</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New workflow</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3" data-testid="workflow-form">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name *</Label>
              <Input required value={form.name} onChange={(e) => update({ name: e.target.value })} data-testid="workflow-name" />
            </div>
            <div>
              <Label>Slug (optional)</Label>
              <Input value={form.slug} onChange={(e) => update({ slug: e.target.value })} placeholder="auto from name" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => update({ description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Steps</Label>
            {form.steps.map((s, i) => (
              <div key={i} className="rounded-xl border border-border p-3 space-y-2 bg-secondary/20">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono">Step {i + 1}</div>
                  {form.steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(i)} className="text-muted-foreground hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={s.agent_id} onChange={(e) => updateStep(i, { agent_id: e.target.value })} data-testid={`workflow-step-agent-${i}`}>
                  <option value="">— Pick an agent —</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.emoji} {a.name} ({a.role_title})</option>)}
                </select>
                <Textarea rows={2} placeholder="Instructions for this step…" value={s.instructions} onChange={(e) => updateStep(i, { instructions: e.target.value })} data-testid={`workflow-step-instr-${i}`} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addStep} data-testid="workflow-add-step"><Plus className="w-3.5 h-3.5 mr-1" /> Add step</Button>
          </div>
          <DialogFooter>
            <Button type="submit" data-testid="workflow-create-submit">Create workflow</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
