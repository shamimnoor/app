import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

export default function Projects() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/projects").then((r) => setItems(r.data.items)).catch(()=>{}); }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20" data-testid="projects-page">
      <div className="label-mono">Projects</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95] max-w-3xl">
        Selected client systems.
      </h1>
      <p className="mt-5 text-muted-foreground max-w-2xl">
        A small, ongoing portfolio of operating systems I've designed and shipped for founders.
      </p>

      <div className="mt-14 grid md:grid-cols-2 gap-5">
        {items.map((p) => (
          <Link to={`/projects/${p.slug}`} key={p.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 transition-transform" data-testid={`project-card-${p.slug}`}>
            <div className="aspect-[16/10] overflow-hidden bg-secondary">
              <img src={p.cover} alt={p.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
            </div>
            <div className="p-6">
              <div className="label-mono">{p.industry}</div>
              <h3 className="font-display text-2xl font-semibold mt-1.5 tracking-tight">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.summary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tags?.map((t) => (
                  <span key={t} className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-secondary/50">{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
