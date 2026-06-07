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
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export default function Comments({ contentType, contentId }) {
  const { user } = useAuth() || {};
  const [items, setItems] = useState([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/social/comments", { params: { content_type: contentType, content_id: contentId } });
      setItems(res.data.items);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    if (contentId) load();
    // eslint-disable-next-line
  }, [contentId, contentType]);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setBusy(true);
    try {
      const res = await api.post("/social/comments", { content_type: contentType, content_id: contentId, body });
      setItems((prev) => [res.data, ...prev]);
      setBody("");
    } catch (err) {
      toast.error("Could not post comment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="comments" className="mt-16 border-t border-border pt-10" data-testid="comments-section">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Comments</h2>
        <div className="label-mono">{items.length} replies</div>
      </div>

      {user ? (
        <form onSubmit={submit} className="mb-8 flex gap-3">
          <img src={user.avatar} className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-1" alt="" />
          <div className="flex-1">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts…"
              className="resize-none min-h-[80px]"
              data-testid="comment-input"
            />
            <div className="flex justify-end mt-2">
              <Button type="submit" disabled={busy || !body.trim()} data-testid="comment-submit-button">
                {busy ? "Posting…" : "Post comment"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-5 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          <Link to="/login" className="text-foreground underline">Sign in</Link> or{" "}
          <Link to="/register" className="text-foreground underline">create an account</Link> to leave a comment.
        </div>
      )}

      <div className="space-y-5" data-testid="comments-list">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">No comments yet. Be the first to share.</div>
        )}
        {items.map((c) => (
          <div key={c.id} className="flex gap-3" data-testid={`comment-${c.id}`}>
            <img src={c.user?.avatar} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{c.user?.name}</span>
                <span className="label-mono">{timeAgo(c.created_at)}</span>
              </div>
              <div className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
