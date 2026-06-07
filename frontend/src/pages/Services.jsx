import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Services() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/services").then((r) => setItems(r.data.items)).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-12 py-20" data-testid="services-page">
      <div className="label-mono">Services</div>
      <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tighter mt-3 leading-[0.95] max-w-4xl">
        Six engagements. <br/> One operating system.
      </h1>
      <p className="mt-5 text-muted-foreground max-w-2xl">
        Every engagement is scoped to deliver a working, owned system — not a deck.
      </p>

      <div className="mt-14 space-y-5">
        {items.map((s, i) => {
          const Icon = Icons[s.icon] || Icons.Sparkles;
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-8 grid lg:grid-cols-[1fr_280px] gap-8" data-testid={`service-card-${s.id}`}>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="label-mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{s.title}</h3>
                <p className="text-muted-foreground mt-3 max-w-xl">{s.description}</p>
                <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {s.deliverables.map((d) => (
                    <li key={d} className="text-sm flex items-center gap-2">
                      <Check className="w-4 h-4 text-[hsl(var(--accent))]" /> {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:border-l lg:border-border lg:pl-8 flex flex-col justify-between">
                <div>
                  <div className="label-mono">Investment</div>
                  <div className="font-display text-2xl font-bold mt-2">{s.starting_price}</div>
                  <p className="text-xs text-muted-foreground mt-2">Custom scopes also available.</p>
                </div>
                <Button asChild className="mt-6 w-full" data-testid={`service-cta-${s.id}`}>
                  <Link to="/hire">Start this engagement →</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
