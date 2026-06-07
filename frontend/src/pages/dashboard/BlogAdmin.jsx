import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function BlogAdmin() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", excerpt: "", body: "", cover: "", category: "Systems", tags: "", status: "published" });

  const load = async () => {
    const all = await api.get("/blog").then((r) => r.data.items).catch(() => []);
    setItems(all);
  };
  useEffect(() => { load(); }, []);

  const reset = () => setForm({ title: "", excerpt: "", body: "", cover: "", category: "Systems", tags: "", status: "published" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/blog", {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success(form.status === "draft" ? "Draft saved" : "Post published");
      setOpen(false);
      reset();
      load();
    } catch { toast.error("Could not save post"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try { await api.delete(`/admin/blog/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Could not delete"); }
  };

  const published = items.filter((i) => i.status === "published");
  const drafts = items.filter((i) => i.status === "draft");

  const renderList = (list) => (
    <div className="space-y-3 mt-4">
      {list.length === 0 && <div className="text-sm text-muted-foreground">Nothing here yet.</div>}
      {list.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4" data-testid={`blog-row-${p.slug}`}>
          {p.cover ? <img src={p.cover} className="w-16 h-16 rounded-lg object-cover bg-secondary flex-shrink-0" alt="" /> : <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center"><FileText className="w-5 h-5 text-muted-foreground" /></div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-[10px]">{p.category}</Badge>
              {p.status === "draft" && <Badge variant="outline" className="font-mono text-[10px]">Draft</Badge>}
            </div>
            <div className="font-display font-semibold mt-1 truncate">{p.title}</div>
            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.excerpt}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-muted-foreground">{p.views || 0} views</div>
            <button onClick={() => remove(p.id)} className="mt-2 p-1.5 hover:bg-secondary rounded" data-testid={`blog-delete-${p.id}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8" data-testid="dashboard-blog-admin">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-mono">Blog CMS</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Posts & drafts</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="blog-new-button"><Plus className="w-4 h-4 mr-1.5" />New post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New blog post</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4" data-testid="blog-new-form">
              <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
              <div><Label>Excerpt</Label><Input required value={form.excerpt} onChange={(e) => setForm({...form, excerpt: e.target.value})} /></div>
              <div><Label>Cover URL</Label><Input value={form.cover} onChange={(e) => setForm({...form, cover: e.target.value})} placeholder="https://…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} /></div>
                <div><Label>Tags (comma)</Label><Input value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})} /></div>
              </div>
              <div><Label>Body (markdown ok)</Label><Textarea required value={form.body} onChange={(e) => setForm({...form, body: e.target.value})} className="min-h-[220px]" /></div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setForm({...form, status: "draft"}); setTimeout(submit, 0); }}>Save as draft</Button>
                <Button type="submit" className="flex-1" onClick={() => setForm({...form, status: "published"})}>Publish</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="published">
        <TabsList>
          <TabsTrigger value="published" data-testid="blog-tab-published">Published · {published.length}</TabsTrigger>
          <TabsTrigger value="drafts" data-testid="blog-tab-drafts">Drafts · {drafts.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="published">{renderList(published)}</TabsContent>
        <TabsContent value="drafts">{renderList(drafts)}</TabsContent>
      </Tabs>
    </div>
  );
}
