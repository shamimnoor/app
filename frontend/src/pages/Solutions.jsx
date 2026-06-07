import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

export default function Solutions() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/solutions").then((r) => setItems(r.data.items)).catch(()=>{}); }, []);
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20" data-testid="solutions-page">
      <div className="label-mono">Solutions</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95] max-w-3xl">
        Pre-architected systems<br /> for common operator problems.
      </h1>
      <p className="mt-5 text-muted-foreground max-w-2xl">
        Each solution is a starting blueprint we adapt to your team — not an off-the-shelf product.
      </p>

      <div className="mt-12 grid md:grid-cols-2 gap-4">
        {items.map((s, i) => (
          <Link to="/hire" key={s.id} className="group rounded-2xl border border-border bg-card p-7 hover:-translate-y-0.5 transition-transform" data-testid={`solution-card-${s.id}`}>
            <div className="label-mono">{String(i + 1).padStart(2, "0")} · Blueprint</div>
            <h3 className="font-display text-2xl font-bold tracking-tight mt-2">{s.title}</h3>
            <p className="text-muted-foreground mt-2">{s.summary}</p>
            <div className="mt-5 text-sm underline underline-offset-4">Discuss this solution →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
