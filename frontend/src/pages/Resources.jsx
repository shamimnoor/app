import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Resources() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/resources").then((r) => setItems(r.data.items)).catch(()=>{}); }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20" data-testid="resources-page">
      <div className="label-mono">Resources</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95]">
        Free tooling for serious operators.
      </h1>

      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 transition-transform" data-testid={`resource-card-${r.id}`}>
            <div className="aspect-video bg-secondary overflow-hidden">
              <img src={r.cover} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-5">
              <div className="label-mono">{r.type}</div>
              <h3 className="font-display text-lg font-semibold mt-1.5">{r.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.summary}</p>
              <Button asChild variant="outline" size="sm" className="mt-5 w-full">
                <a href={r.url} target="_blank" rel="noreferrer"><Download className="w-3.5 h-3.5 mr-1.5" />Get it</a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
