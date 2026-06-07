import React, { useEffect, useState } from "react";
import { Heart, MessageCircle, Bookmark, Share2, Eye, Check } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SHARE_TARGETS = [
  { name: "Twitter / X", url: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { name: "LinkedIn", url: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { name: "Facebook", url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { name: "Telegram", url: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: "WhatsApp", url: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}` },
];

export default function SocialActions({ contentType, contentId, title = "", views, className = "" }) {
  const [stats, setStats] = useState({ likes: 0, liked: false, bookmarked: false, comments: 0 });
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/social/stats", { params: { content_type: contentType, content_id: contentId } });
      setStats(res.data);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    if (contentId) load();
    // eslint-disable-next-line
  }, [contentId, contentType]);

  const toggleLike = async () => {
    try {
      const res = await api.post("/social/like", { content_type: contentType, content_id: contentId });
      setStats((s) => ({ ...s, liked: res.data.liked, likes: res.data.count }));
    } catch (e) {
      toast.error("Could not save your like");
    }
  };

  const toggleBookmark = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast("Sign in to bookmark", { description: "Create a free account to save items." });
      return;
    }
    try {
      const res = await api.post("/social/bookmark", { content_type: contentType, content_id: contentId, title });
      setStats((s) => ({ ...s, bookmarked: res.data.bookmarked }));
    } catch (e) {
      toast.error("Could not bookmark");
    }
  };

  const copyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`} data-testid={`social-actions-${contentType}-${contentId}`}>
      <button
        onClick={toggleLike}
        data-testid="social-like-button"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
          stats.liked ? "bg-[hsl(var(--accent))]/15 border-[hsl(var(--accent))]/30 text-[hsl(var(--accent))]" : "border-border hover:bg-secondary"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${stats.liked ? "fill-current" : ""}`} />
        <span className="font-mono">{stats.likes}</span>
      </button>

      <a
        href="#comments"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-border hover:bg-secondary transition-colors"
        data-testid="social-comments-link"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span className="font-mono">{stats.comments}</span>
      </a>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-border hover:bg-secondary transition-colors"
            data-testid="social-share-button"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>Share</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {SHARE_TARGETS.map((s) => (
            <DropdownMenuItem
              key={s.name}
              onClick={() => {
                const url = window.location.href;
                window.open(s.url(url, title), "_blank", "noopener,noreferrer");
              }}
              data-testid={`share-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {s.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={copyLink} data-testid="share-copy-link">
            Copy link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={toggleBookmark}
        data-testid="social-bookmark-button"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
          stats.bookmarked ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"
        }`}
      >
        <Bookmark className={`w-3.5 h-3.5 ${stats.bookmarked ? "fill-current" : ""}`} />
      </button>

      {views !== undefined && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground" data-testid="social-views">
          <Eye className="w-3.5 h-3.5" />
          <span className="font-mono">{views}</span>
        </div>
      )}
    </div>
  );
}
