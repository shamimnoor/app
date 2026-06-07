import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function Blog() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/blog").then((r) => setItems(r.data.items)).catch(()=>{}); }, []);
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-12 py-20" data-testid="blog-page">
      <div className="label-mono">Blog</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95]">
        Field notes.
      </h1>
      <p className="mt-5 text-muted-foreground max-w-2xl">
        Essays, frameworks and tactics on building modern operating systems.
      </p>

      <div className="mt-14 divide-y divide-border border-t border-border">
        {items.map((b) => (
          <Link to={`/blog/${b.slug}`} key={b.id} className="block group py-8" data-testid={`blog-card-${b.slug}`}>
            <div className="grid md:grid-cols-[1fr_240px] gap-6 items-start">
              <div>
                <div className="flex items-center gap-3 label-mono">
                  <Badge variant="secondary" className="font-mono text-[10px]">{b.category}</Badge>
                  <span>{b.read_time} min read</span>
                  <span>·</span>
                  <span>{new Date(b.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-display text-3xl font-bold tracking-tight mt-3 group-hover:translate-x-0.5 transition-transform">{b.title}</h3>
                <p className="text-muted-foreground mt-2 max-w-xl">{b.excerpt}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {b.tags?.map((t) => (
                    <span key={t} className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-secondary/50">{t}</span>
                  ))}
                </div>
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border bg-secondary">
                <img src={b.cover} alt="" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
