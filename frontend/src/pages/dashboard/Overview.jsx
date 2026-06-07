import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Mail, MessageSquare, FolderKanban, Eye, Heart, MessageCircle, TrendingUp } from "lucide-react";

function KPI({ label, value, icon: Icon, hint }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:-translate-y-0.5 transition-transform" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between">
        <div className="label-mono">{label}</div>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/overview").then((r) => setData(r.data)).catch(()=>{}); }, []);

  if (!data) return <div className="text-sm text-muted-foreground">Loading overview…</div>;
  const k = data.kpis;

  return (
    <div className="space-y-8" data-testid="dashboard-overview">
      <div>
        <div className="label-mono">Founder OS · Overview</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Today, at a glance.</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Users" value={k.users} icon={Users} hint="Registered accounts" />
        <KPI label="Leads" value={k.leads} icon={Mail} hint={`${k.new_leads} new`} />
        <KPI label="Projects" value={k.projects} icon={FolderKanban} />
        <KPI label="Revenue" value={`$${(k.revenue || 0).toLocaleString()}`} icon={TrendingUp} hint="Projected from pipeline" />
        <KPI label="Messages" value={k.messages} icon={MessageSquare} />
        <KPI label="Comments" value={k.comments} icon={MessageCircle} />
        <KPI label="Likes" value={k.likes} icon={Heart} />
        <KPI label="Views" value={k.views} icon={Eye} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card p-6" data-testid="overview-top-posts">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Top posts</h2>
            <div className="label-mono">By views</div>
          </div>
          <div className="mt-5 space-y-3">
            {data.top_posts.map((p) => (
              <div key={p.slug || p.title} className="flex items-center justify-between text-sm">
                <span className="truncate pr-3">{p.title}</span>
                <span className="font-mono text-muted-foreground">{p.views}</span>
              </div>
            ))}
            {data.top_posts.length === 0 && <div className="text-sm text-muted-foreground">No views yet.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6" data-testid="overview-top-projects">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Top projects</h2>
            <div className="label-mono">By views</div>
          </div>
          <div className="mt-5 space-y-3">
            {data.top_projects.map((p) => (
              <div key={p.slug || p.title} className="flex items-center justify-between text-sm">
                <span className="truncate pr-3">{p.title}</span>
                <span className="font-mono text-muted-foreground">{p.views}</span>
              </div>
            ))}
            {data.top_projects.length === 0 && <div className="text-sm text-muted-foreground">No views yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
