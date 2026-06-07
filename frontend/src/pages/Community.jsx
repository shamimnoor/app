import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { toast } from "sonner";

function timeAgo(iso) {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString();
  } catch { return ""; }
}

export default function Community() {
  const { user } = useAuth() || {};
  const [posts, setPosts] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/community/posts").then((r) => setPosts(r.data.items)).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setBusy(true);
    try {
      const res = await api.post("/community/posts", { body });
      setPosts((prev) => [res.data, ...prev]);
      setBody("");
    } catch { toast.error("Could not post"); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-20" data-testid="community-page">
      <div className="label-mono">Community</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95]">
        Operators talking shop.
      </h1>
      <p className="mt-5 text-muted-foreground max-w-xl">
        A small, ad-free feed for founders building serious systems. Share questions, wins, links and rough ideas.
      </p>

      {user ? (
        <form onSubmit={submit} className="mt-10 rounded-2xl border border-border bg-card p-5" data-testid="community-post-form">
          <div className="flex gap-3">
            <img src={user.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share something useful…" className="resize-none min-h-[80px]" data-testid="community-body-input" />
          </div>
          <div className="flex justify-end mt-3">
            <Button type="submit" disabled={busy || !body.trim()} data-testid="community-submit">Post</Button>
          </div>
        </form>
      ) : (
        <div className="mt-10 p-5 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          <Link to="/login" className="text-foreground underline">Sign in</Link> or{" "}
          <Link to="/register" className="text-foreground underline">create an account</Link> to post.
        </div>
      )}

      <div className="mt-10 space-y-5" data-testid="community-feed">
        {posts.length === 0 && <div className="text-sm text-muted-foreground">No posts yet — be the first.</div>}
        {posts.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <img src={p.user?.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
              <div>
                <div className="text-sm font-medium">{p.user?.name}</div>
                <div className="label-mono">{timeAgo(p.created_at)} ago</div>
              </div>
            </div>
            <div className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{p.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
