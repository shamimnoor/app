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
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Brain, Plus, Search, Trash2, BookOpen, Lightbulb, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listMemory, createMemory, deleteMemory,
  listKnowledge, createKnowledge, deleteKnowledge,
  searchKnowledge,
} from "@/lib/aiBrain";

const MEMORY_KINDS = ["note", "fact", "preference", "context", "goal"];
const KNOWLEDGE_TYPES = ["doc", "url", "note", "transcript", "sop"];

export default function AIBrain() {
  const [tab, setTab] = useState("memory");

  return (
    <div className="space-y-8" data-testid="dashboard-ai-brain">
      <div>
        <div className="label-mono flex items-center gap-2"><Brain className="w-3 h-3" /> AI Brain Layer</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Memory · Knowledge · Retrieval</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything the agents and Command Center can reason over. Memory is persistent context; Knowledge powers RAG lookups.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList data-testid="brain-tabs">
          <TabsTrigger value="memory" data-testid="tab-memory"><Lightbulb className="w-3.5 h-3.5 mr-1.5" /> Memory</TabsTrigger>
          <TabsTrigger value="knowledge" data-testid="tab-knowledge"><BookOpen className="w-3.5 h-3.5 mr-1.5" /> Knowledge</TabsTrigger>
          <TabsTrigger value="retrieval" data-testid="tab-retrieval"><Zap className="w-3.5 h-3.5 mr-1.5" /> Retrieval test</TabsTrigger>
        </TabsList>

        <TabsContent value="memory"><MemoryPanel /></TabsContent>
        <TabsContent value="knowledge"><KnowledgePanel /></TabsContent>
        <TabsContent value="retrieval"><RetrievalPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
function MemoryPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ kind: "note", title: "", content: "", tags: "", importance: 3 });

  const load = async () => {
    setLoading(true);
    try { setRows(await listMemory()); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createMemory({
        kind: form.kind,
        title: form.title,
        content: form.content,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        importance: Number(form.importance) || 3,
      });
      toast.success("Memory saved");
      setOpen(false);
      setForm({ kind: "note", title: "", content: "", tags: "", importance: 3 });
      load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this memory?")) return;
    try { await deleteMemory(id); load(); toast.success("Deleted"); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{rows.length} memory entries</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="memory-new-button"><Plus className="w-4 h-4 mr-1.5" /> New memory</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New memory entry</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3" data-testid="memory-form">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kind</Label>
                  <select className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} data-testid="memory-kind">
                    {MEMORY_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Importance (1–5)</Label>
                  <Input type="number" min={1} max={5} value={form.importance} onChange={(e) => setForm({ ...form, importance: e.target.value })} data-testid="memory-importance" />
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="One-liner label" data-testid="memory-title" />
              </div>
              <div>
                <Label>Content *</Label>
                <Textarea required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="What should every agent remember about this?" data-testid="memory-content" />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="brand, pricing, founder" data-testid="memory-tags" />
              </div>
              <DialogFooter>
                <Button type="submit" data-testid="memory-save-button">Save memory</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState label="No memory yet. Add what every agent should know about you & your business." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((m) => (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-4" data-testid={`memory-row-${m.id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{m.kind}</Badge>
                  <span className="text-xs text-muted-foreground">imp {m.importance}</span>
                </div>
                <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-rose-500" data-testid={`memory-delete-${m.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {m.title && <div className="font-display font-semibold mb-1">{m.title}</div>}
              <div className="text-sm whitespace-pre-wrap">{m.content}</div>
              {m.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {m.tags.map((t) => <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/60">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
function KnowledgePanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", source_type: "doc", source_url: "", content: "", tags: "" });

  const load = async () => {
    setLoading(true);
    try { setRows(await listKnowledge()); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createKnowledge({
        title: form.title,
        source_type: form.source_type,
        source_url: form.source_url,
        content: form.content,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Knowledge entry added");
      setOpen(false);
      setForm({ title: "", source_type: "doc", source_url: "", content: "", tags: "" });
      load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this entry?")) return;
    try { await deleteKnowledge(id); load(); toast.success("Deleted"); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{rows.length} knowledge entries · used for RAG retrieval</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="knowledge-new-button"><Plus className="w-4 h-4 mr-1.5" /> New entry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New knowledge entry</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3" data-testid="knowledge-form">
              <div>
                <Label>Title *</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="knowledge-title" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Source type</Label>
                  <select className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm" value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} data-testid="knowledge-source-type">
                    {KNOWLEDGE_TYPES.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Source URL (optional)</Label>
                  <Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://…" data-testid="knowledge-url" />
                </div>
              </div>
              <div>
                <Label>Content *</Label>
                <Textarea required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Paste the document, notes or transcript here." data-testid="knowledge-content" />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="sop, marketing, internal" data-testid="knowledge-tags" />
              </div>
              <DialogFooter>
                <Button type="submit" data-testid="knowledge-save-button">Save entry</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState label="No knowledge yet. Paste docs, SOPs and transcripts the agents should retrieve from." />
      ) : (
        <div className="space-y-3">
          {rows.map((k) => (
            <div key={k.id} className="rounded-2xl border border-border bg-card p-4" data-testid={`knowledge-row-${k.id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{k.source_type}</Badge>
                  <span className="font-display font-semibold">{k.title}</span>
                </div>
                <button onClick={() => remove(k.id)} className="text-muted-foreground hover:text-rose-500" data-testid={`knowledge-delete-${k.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{k.content}</div>
              {k.source_url && <a href={k.source_url} target="_blank" rel="noreferrer" className="text-xs underline mt-2 inline-block">{k.source_url}</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
function RetrievalPanel() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState([]);

  const run = async (e) => {
    e?.preventDefault?.();
    if (!query.trim()) return;
    setBusy(true);
    try {
      const data = await searchKnowledge(query, 8);
      setHits(data);
      if (data.length === 0) toast.info("No matches — add more knowledge or rephrase.");
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="flex gap-2" data-testid="retrieval-form">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try: pricing model, sales objections, launch playbook…" data-testid="retrieval-query" />
        <Button type="submit" disabled={busy || !query.trim()} data-testid="retrieval-search-button">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </form>

      {hits.length > 0 ? (
        <div className="space-y-3" data-testid="retrieval-results">
          {hits.map((k) => (
            <div key={k.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-display font-semibold">{k.title}</div>
                <Badge variant="secondary">score {Number(k.score).toFixed(2)}</Badge>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{k.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Retrieval runs lexical text search via the `search_knowledge` RPC. Vector search can be added later by enabling pgvector.</div>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
