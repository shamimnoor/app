import React, { useEffect, useRef, useState } from "react";
import { api, FOUNDER } from "@/lib/api";
import { Send } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function MessagesAdmin() {
  const { user } = useAuth() || {};
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState([]);
  const [body, setBody] = useState("");
  const scrollRef = useRef(null);

  const load = async () => {
    const res = await api.get("/messages");
    setThreads(res.data.threads || []);
    if (!activeId && res.data.threads?.length) setActiveId(res.data.threads[0].thread_user_id);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeId) return;
    api.get(`/messages/thread/${activeId}`).then((r) => setThread(r.data.messages)).catch(() => {});
  }, [activeId, threads]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !activeId) return;
    const text = body; setBody("");
    try {
      const res = await api.post("/messages", { body: text, thread_user_id: activeId });
      setThread((t) => [...t, res.data]);
      load();
    } catch {}
  };

  return (
    <div className="space-y-6" data-testid="dashboard-messages">
      <div>
        <div className="label-mono">Messages</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Inbox</h1>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-0 rounded-2xl border border-border bg-card overflow-hidden h-[70vh]">
        <div className="border-r border-border overflow-y-auto" data-testid="messages-thread-list">
          {threads.length === 0 && <div className="p-5 text-sm text-muted-foreground">No conversations yet.</div>}
          {threads.map((t) => (
            <button
              key={t.thread_user_id}
              onClick={() => setActiveId(t.thread_user_id)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-secondary/50 ${activeId === t.thread_user_id ? "bg-secondary/60" : ""}`}
              data-testid={`thread-${t.thread_user_id}`}
            >
              <div className="flex items-center gap-3">
                <img src={t.user_avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${t.user_name}`} className="w-9 h-9 rounded-full object-cover bg-secondary" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.user_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.messages?.[t.messages.length - 1]?.body || ""}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
            {!activeId && <div className="text-sm text-muted-foreground">Select a conversation.</div>}
            {thread.map((m) => {
              const mine = m.from_id === user.id;
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && <img src={m.from_avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${m.from_name}`} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1 bg-secondary" alt="" />}
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${mine ? "bg-foreground text-background rounded-br-sm" : "bg-secondary rounded-bl-sm"}`}>
                    {m.body}
                  </div>
                </div>
              );
            })}
          </div>
          {activeId && (
            <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Reply…"
                className="flex-1 bg-secondary/60 px-3 py-2 rounded-md text-sm outline-none border border-transparent focus:border-border"
                data-testid="messages-reply-input"
              />
              <button type="submit" className="w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center" data-testid="messages-reply-send">
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
