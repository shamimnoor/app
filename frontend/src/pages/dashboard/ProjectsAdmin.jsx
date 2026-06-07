import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectsAdmin() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", body: "", cover: "", tags: "", industry: "", client: "" });

  const load = () => api.get("/projects").then((r) => setItems(r.data.items)).catch(()=>{});
  useEffect(() => { load(); }, []);

  const reset = () => setForm({ title: "", summary: "", body: "", cover: "", tags: "", industry: "", client: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/projects", {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Project created");
      setOpen(false);
      reset();
      load();
    } catch { toast.error("Could not create project"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try { await api.delete(`/admin/projects/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Could not delete"); }
  };

  return (
    <div className="space-y-8" data-testid="dashboard-projects-admin">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-mono">Projects</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Portfolio management</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="projects-new-button"><Plus className="w-4 h-4 mr-1.5" />New project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4" data-testid="projects-new-form">
              <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
              <div><Label>Summary</Label><Input required value={form.summary} onChange={(e) => setForm({...form, summary: e.target.value})} /></div>
              <div><Label>Cover URL</Label><Input value={form.cover} onChange={(e) => setForm({...form, cover: e.target.value})} placeholder="https://…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value})} /></div>
                <div><Label>Client</Label><Input value={form.client} onChange={(e) => setForm({...form, client: e.target.value})} /></div>
              </div>
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})} /></div>
              <div><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({...form, body: e.target.value})} className="min-h-[160px]" /></div>
              <Button type="submit" className="w-full">Create project</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-5 flex gap-4" data-testid={`project-admin-${p.slug}`}>
            <img src={p.cover} alt="" className="w-24 h-24 rounded-lg object-cover bg-secondary" />
            <div className="flex-1 min-w-0">
              <div className="label-mono">{p.industry}</div>
              <div className="font-display font-semibold truncate">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.summary}</div>
              <div className="mt-3 flex items-center justify-between">
                <div className="font-mono text-xs text-muted-foreground">{p.views || 0} views</div>
                <button onClick={() => remove(p.id)} className="p-1.5 hover:bg-secondary rounded" data-testid={`project-delete-${p.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
