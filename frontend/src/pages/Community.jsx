import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Community() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/community")
      .then((res) => setFeed(res.data))
      .catch(() => setFeed([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-12">
      <h1 className="font-display text-3xl font-bold">Community Feed</h1>
      <p className="text-muted-foreground">Recent activity from the community.</p>

      <div className="mt-8 space-y-6">
        {loading ? (
          <p className="text-muted-foreground">Loading feed...</p>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src={item.profiles.avatar} />
                <AvatarFallback>{item.profiles.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm">{item.profiles.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</div>
                </div>
                <p className="text-sm mt-1">{item.body}</p>
                <Link to={`/${item.content_type}/${item.content_id}`} className="text-xs text-muted-foreground hover:underline">
                  View context
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
