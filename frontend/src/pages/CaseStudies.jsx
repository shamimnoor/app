import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

export default function CaseStudies() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/case-studies").then((r) => setItems(r.data.items)).catch(()=>{}); }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20" data-testid="case-studies-page">
      <div className="label-mono">Case studies</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95] max-w-3xl">
        Numbers, not narratives.
      </h1>

      <div className="mt-14 space-y-5">
        {items.map((c, i) => (
          <Link to={`/case-studies/${c.slug}`} key={c.id} className="group block rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-0.5 transition-transform" data-testid={`case-card-${c.slug}`}>
            <div className="grid md:grid-cols-[280px_1fr]">
              <div className="aspect-[4/3] md:aspect-auto bg-secondary overflow-hidden">
                <img src={c.cover} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
              </div>
              <div className="p-7">
                <div className="label-mono">{String(i + 1).padStart(2, "0")} · Case study</div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold mt-2 tracking-tight">{c.title}</h3>
                <p className="text-muted-foreground mt-2">{c.summary}</p>
                <div className="mt-5 flex flex-wrap gap-4">
                  {c.metrics?.map((m) => (
                    <div key={m.label} className="px-3 py-2 rounded-lg border border-border bg-secondary/40">
                      <div className="label-mono">{m.label}</div>
                      <div className="font-display font-bold text-xl mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
