import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Database, RotateCcw, Sparkles, AlertTriangle, Loader2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const TABLES = [
  "profiles","services","solutions","industries","resources",
  "projects","case_studies","blog_posts","leads","messages",
  "comments","likes","bookmarks","community_posts",
];

export default function DatabaseAdmin() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
  const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : "";

  const loadCounts = async () => {
    setLoading(true);
    const result = {};
    await Promise.all(
      TABLES.map(async (t) => {
        const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
        result[t] = error ? "error" : count || 0;
      })
    );
    setCounts(result);
    setLoading(false);
  };

  useEffect(() => { loadCounts(); }, []);

  return (
    <div className="space-y-8" data-testid="dashboard-database">
      <div>
        <div className="label-mono">Database</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">Supabase control</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Project: <span className="font-mono">{projectRef}</span> ·{" "}
          <a href={`https://supabase.com/dashboard/project/${projectRef}`} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">
            Open in Supabase <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Table status</h2>
          <Button variant="outline" size="sm" onClick={loadCounts} disabled={loading} data-testid="db-refresh">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Refresh"}
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {TABLES.map((t) => {
            const v = counts[t];
            const bad = v === "error";
            return (
              <div
                key={t}
                className={`px-3 py-2 rounded-lg border text-sm flex items-center justify-between ${bad ? "border-rose-500/30 bg-rose-500/10" : "border-border bg-secondary/30"}`}
                data-testid={`db-table-${t}`}
              >
                <span className="font-mono text-xs">{t}</span>
                <span className={`font-mono text-xs ${bad ? "text-rose-500" : "text-muted-foreground"}`}>
                  {loading ? "…" : bad ? "—" : v}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Tables showing "—" don't exist yet — run the migration to create them.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <RunSqlCard
          icon={Database}
          title="Run schema migration"
          desc="Re-applies 0001_init.sql. Safe to re-run — uses IF NOT EXISTS / DROP IF EXISTS."
          file="/migrations/0001_init.sql"
          actionLabel="Run migration"
          projectRef={projectRef}
          onDone={loadCounts}
          dataTestid="db-run-migration"
        />
        <RunSqlCard
          icon={Sparkles}
          title="Reseed content"
          desc="Re-applies 0002_seed.sql. Idempotent — uses ON CONFLICT DO NOTHING."
          file="/migrations/0002_seed.sql"
          actionLabel="Reseed content"
          projectRef={projectRef}
          onDone={loadCounts}
          dataTestid="db-reseed"
        />
        <RunSqlCard
          icon={RotateCcw}
          title="Reset & rebuild"
          desc="Drops every table and re-runs both migrations from scratch. Destroys all data."
          file="reset"
          actionLabel="Reset database"
          projectRef={projectRef}
          onDone={loadCounts}
          danger
          dataTestid="db-reset"
        />
      </div>
    </div>
  );
}

function RunSqlCard({ icon: Icon, title, desc, file, actionLabel, projectRef, onDone, danger = false, dataTestid }) {
  const [open, setOpen] = useState(false);
  const [pat, setPat] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const run = async () => {
    if (!pat.trim().startsWith("sbp_")) return toast.error("Token must start with sbp_");
    setBusy(true); setErr(null);
    try {
      let sqls = [];
      if (file === "reset") {
        const dropAll = `do $$ declare r record; begin
          for r in (select tablename from pg_tables where schemaname='public') loop
            execute format('drop table if exists public.%I cascade', r.tablename);
          end loop;
        end $$;`;
        const initSql = await fetch("/migrations/0001_init.sql").then((r) => r.text());
        const seedSql = await fetch("/migrations/0002_seed.sql").then((r) => r.text());
        sqls = [["Drop all tables", dropAll], ["Re-run schema", initSql], ["Reseed", seedSql]];
      } else {
        const sql = await fetch(file).then((r) => r.text());
        sqls = [[title, sql]];
      }
      for (const [label, sql] of sqls) {
        const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
          method: "POST",
          headers: { Authorization: `Bearer ${pat.trim()}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: sql }),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`${label}: ${t}`);
        }
      }
      toast.success(`${actionLabel} complete.`);
      setOpen(false);
      setPat("");
      onDone?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-2xl border ${danger ? "border-rose-500/30" : "border-border"} bg-card p-5`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${danger ? "bg-rose-500/15 text-rose-500" : "bg-secondary"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={danger ? "destructive" : "outline"} className="mt-4 w-full" data-testid={dataTestid}>
            {actionLabel}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionLabel}</DialogTitle>
            <DialogDescription>
              {danger
                ? "This will permanently delete every row in every table. There is no undo."
                : "Paste a Supabase Personal Access Token to authorise the operation."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Personal Access Token</Label>
              <Input type="password" value={pat} onChange={(e) => setPat(e.target.value)} placeholder="sbp_…" data-testid={`${dataTestid}-pat`} />
              <p className="text-xs text-muted-foreground mt-1.5">
                Get one at <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noreferrer" className="underline">supabase.com/dashboard/account/tokens</a>
              </p>
            </div>
            {err && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-mono whitespace-pre-wrap" data-testid={`${dataTestid}-error`}>
                {err}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant={danger ? "destructive" : "default"} onClick={run} disabled={busy || !pat} data-testid={`${dataTestid}-confirm`}>
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running…</> : <><Check className="w-4 h-4 mr-2" />Run</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
