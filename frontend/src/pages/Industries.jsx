import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Industries() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/industries").then((r) => setItems(r.data.items)).catch(()=>{}); }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20" data-testid="industries-page">
      <div className="label-mono">Industries</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95] max-w-3xl">
        Industries I know cold.
      </h1>
      <p className="mt-5 text-muted-foreground max-w-2xl">
        Each industry below has its own playbook — SOPs, schemas, and automation patterns I've shipped multiple times.
      </p>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i, idx) => (
          <div key={i.id} className="rounded-2xl border border-border bg-card p-6" data-testid={`industry-card-${i.id}`}>
            <div className="label-mono">{String(idx + 1).padStart(2, "0")}</div>
            <h3 className="font-display text-xl font-semibold mt-2">{i.name}</h3>
            <p className="text-sm text-muted-foreground mt-2">{i.blurb}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
