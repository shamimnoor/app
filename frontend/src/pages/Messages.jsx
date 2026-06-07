import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, FOUNDER } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Send } from "lucide-react";

export default function Messages() {
  const { user } = useAuth() || {};
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const scrollRef = useRef(null);

  const load = async () => {
    if (!user) return;
    const res = await api.get("/messages");
    setMessages(res.data.messages || []);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    const text = body;
    setBody("");
    try {
      const res = await api.post("/messages", { body: text });
      setMessages((m) => [...m, res.data]);
    } catch {}
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-32 text-center" data-testid="messages-login-prompt">
        <h1 className="font-display text-3xl font-bold">Sign in to message Shamim</h1>
        <p className="text-muted-foreground mt-3">Direct WhatsApp-style messages once you're signed in.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <Link to="/login" className="underline">Sign in</Link>
          <Link to="/register" className="underline">Create account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-20" data-testid="messages-page">
      <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-[70vh]">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <img src={FOUNDER.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
          <div className="flex-1">
            <div className="font-medium">{FOUNDER.name}</div>
            <div className="label-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Usually replies within a day
            </div>
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3" data-testid="messages-list">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-12">Start the conversation — say hi!</div>
          )}
          {messages.map((m) => {
            const mine = m.from_id === user.id;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <img src={FOUNDER.avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1" alt="" />}
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${mine ? "bg-foreground text-background rounded-br-sm" : "bg-secondary rounded-bl-sm"}`}>
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message…"
            className="flex-1 bg-secondary/60 px-3 py-2 rounded-md text-sm outline-none border border-transparent focus:border-border"
            data-testid="messages-input"
          />
          <button type="submit" className="w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center" data-testid="messages-send">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
