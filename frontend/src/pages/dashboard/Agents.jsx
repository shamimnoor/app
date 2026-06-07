import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Bot, Play, Loader2, Send, Sparkles, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { listAgents, getAgent, updateAgent, runAgent } from "@/lib/agents";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [chat, setChat] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAgents();
      setAgents(data);
      if (!selectedId && data[0]) setSelectedId(data[0].id);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = agents.find((a) => a.id === selectedId);

  const send = async () => {
    if (!prompt.trim() || !selected) return;
    const userText = prompt.trim();
    setChat((c) => [...c, { role: "user", text: userText }]);
    setPrompt("");
    setRunning(true);
    try {
      const { output } = await runAgent({ agent: selected, userMessage: userText, useBrain: true });
      setChat((c) => [...c, { role: "assistant", text: output, agent: selected }]);
    } catch (e) {
      setChat((c) => [...c, { role: "assistant", text: `⚠️ ${e.message}` }]);
    } finally {
      setRunning(false);
    }
  };

  const openEdit = async () => {
    if (!selected) return;
    const fresh = await getAgent(selected.id);
    setEditForm(fresh);
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateAgent(editForm.id, {
        name: editForm.name,
        role_title: editForm.role_title,
        emoji: editForm.emoji || "",
        system_prompt: editForm.system_prompt,
        model: editForm.model || "gpt-5.2",
        temperature: Number(editForm.temperature) || 0.7,
        is_active: !!editForm.is_active,
      });
      toast.success("Agent updated");
      setEditOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const reset = () => setChat([]);

  return (
    <div className="space-y-6" data-testid="dashboard-agents">
      <div>
        <div className="label-mono flex items-center gap-2"><Bot className="w-3 h-3" /> Agent Factory</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">18 specialised agents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Each role has its own system prompt, model and temperature. Edit them, then run a test chat — every reply is composed with founder memory + knowledge retrieval.
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Agent picker */}
        <div className="rounded-2xl border border-border bg-card p-2 max-h-[70vh] overflow-y-auto" data-testid="agents-list">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</div>
          ) : agents.map((a) => (
            <button
              key={a.id}
              onClick={() => { setSelectedId(a.id); setChat([]); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${selectedId === a.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"}`}
              data-testid={`agent-pick-${a.id}`}
            >
              <span className="text-base">{a.emoji || "🤖"}</span>
              <span className="flex-1 min-w-0 truncate">
                <span className="font-display font-semibold text-foreground block truncate">{a.name}</span>
                <span className="text-[11px] text-muted-foreground block truncate">{a.role_title}</span>
              </span>
              {!a.is_active && <Badge variant="outline" className="text-[10px]">off</Badge>}
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="rounded-2xl border border-border bg-card flex flex-col min-h-[70vh]" data-testid="agent-chat">
          {selected ? (
            <>
              <div className="border-b border-border px-5 py-4 flex items-center gap-3">
                <div className="text-2xl">{selected.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold">{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.role_title} · {selected.model}</div>
                </div>
                <Button variant="outline" size="sm" onClick={reset} data-testid="agent-reset">Reset</Button>
                <Button variant="outline" size="sm" onClick={openEdit} data-testid="agent-edit-button"><Settings2 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {chat.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-12">
                    Send a message — {selected.name} will reply using the founder memory + knowledge base.
                  </div>
                )}
                {chat.map((m, i) => (
                  <div key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "bg-secondary/40 ml-12" : "border border-border mr-12"}`} data-testid={`agent-msg-${i}`}>
                    <div className="label-mono mb-1.5 flex items-center gap-1.5">
                      {m.role === "user" ? "You" : <><Sparkles className="w-3 h-3" /> {m.agent?.name || selected.name}</>}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  </div>
                ))}
                {running && (
                  <div className="rounded-xl p-3 text-sm border border-border mr-12 flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> {selected.name} is thinking…
                  </div>
                )}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border p-3 flex gap-2">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={`Message ${selected.name}…`}
                  className="resize-none min-h-[52px]"
                  data-testid="agent-input"
                />
                <Button type="submit" disabled={running || !prompt.trim()} data-testid="agent-send">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="m-auto text-sm text-muted-foreground">Select an agent to begin</div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit {editForm?.name}</DialogTitle></DialogHeader>
          {editForm && (
            <form onSubmit={saveEdit} className="space-y-3" data-testid="agent-edit-form">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Role title</Label>
                  <Input value={editForm.role_title} onChange={(e) => setEditForm({ ...editForm, role_title: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Emoji</Label>
                  <Input value={editForm.emoji || ""} onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })} />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} />
                </div>
                <div>
                  <Label>Temperature</Label>
                  <Input type="number" step="0.1" min={0} max={2} value={editForm.temperature} onChange={(e) => setEditForm({ ...editForm, temperature: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>System prompt</Label>
                <Textarea rows={10} value={editForm.system_prompt} onChange={(e) => setEditForm({ ...editForm, system_prompt: e.target.value })} data-testid="agent-edit-prompt" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={!!editForm.is_active} onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })} />
                  <span className="text-sm">Active</span>
                </div>
                <DialogFooter>
                  <Button type="submit" data-testid="agent-edit-save"><Play className="w-4 h-4 mr-1.5" /> Save</Button>
                </DialogFooter>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
