import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, FOUNDER } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Database, Loader2, ExternalLink, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";

/**
 * Public one-time Setup Wizard.
 * Runs migration + seed against Supabase via the Management API using a
 * Personal Access Token (PAT) the founder pastes in.
 * After success the database is ready and the wizard is no longer reachable
 * because it auto-redirects when tables already exist.
 */
export default function Setup() {
  const [checking, setChecking] = useState(true);
  const [alreadyReady, setAlreadyReady] = useState(false);
  const [pat, setPat] = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState([
    { id: "init", label: "Create tables, RLS & triggers", status: "pending" },
    { id: "seed", label: "Insert seed content", status: "pending" },
    { id: "integrations", label: "Create Integrations Hub", status: "pending" },
    { id: "ai_layer", label: "Install AI Brain (memory + knowledge + RAG)", status: "pending" },
    { id: "agents", label: "Seed 18 specialised agents", status: "pending" },
    { id: "workflows", label: "Install multi-agent workflow engine", status: "pending" },
    { id: "verify", label: "Verify install", status: "pending" },
  ]);
  const [errorDetail, setErrorDetail] = useState(null);
  const navigate = useNavigate();

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
  const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : "";

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        // Treat the install as complete only when BOTH the original schema (services)
        // AND the new AI layer (ai_agents) exist. This lets existing users re-run
        // the wizard to install Phase 3–5 migrations without manual SQL.
        const [s, a] = await Promise.all([
          supabase.from("services").select("*", { count: "exact", head: true }),
          supabase.from("ai_agents").select("*", { count: "exact", head: true }),
        ]);
        if (!cancel) {
          const hasContent = !s.error && (s.count || 0) > 0;
          const hasAgents = !a.error && (a.count || 0) > 0;
          if (hasContent && hasAgents) setAlreadyReady(true);
        }
      } catch { /* ignore */ }
      if (!cancel) setChecking(false);
    })();
    return () => { cancel = true; };
  }, []);

  const setStep = (id, status) =>
    setSteps((arr) => arr.map((s) => (s.id === id ? { ...s, status } : s)));

  const runSql = async (sql, label) => {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!res.ok) {
      const txt = await res.text();
      let detail = txt;
      try { detail = JSON.stringify(JSON.parse(txt), null, 2); } catch {}
      throw new Error(`${label} failed (HTTP ${res.status}):\n${detail}`);
    }
    return await res.json().catch(() => ({}));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!pat.trim().startsWith("sbp_")) {
      return toast.error("Token must start with sbp_ — please paste your Supabase Personal Access Token.");
    }
    setBusy(true);
    setErrorDetail(null);

    try {
      // Step 1 — init
      setStep("init", "running");
      const initSql = await fetch("/migrations/0001_init.sql").then((r) => r.text());
      await runSql(initSql, "Schema migration");
      setStep("init", "done");

      // Step 2 — seed
      setStep("seed", "running");
      const seedSql = await fetch("/migrations/0002_seed.sql").then((r) => r.text());
      await runSql(seedSql, "Seed content");
      setStep("seed", "done");

      // Step 3 — integrations hub
      setStep("integrations", "running");
      const intgSql = await fetch("/migrations/0003_integrations.sql").then((r) => r.text());
      await runSql(intgSql, "Integrations Hub");
      setStep("integrations", "done");

      // Step 4 — AI Brain layer
      setStep("ai_layer", "running");
      const brainSql = await fetch("/migrations/0004_ai_layer.sql").then((r) => r.text());
      await runSql(brainSql, "AI Brain layer");
      setStep("ai_layer", "done");

      // Step 5 — Agents
      setStep("agents", "running");
      const agentsSql = await fetch("/migrations/0005_agents.sql").then((r) => r.text());
      await runSql(agentsSql, "Agent Factory");
      setStep("agents", "done");

      // Step 6 — Workflows
      setStep("workflows", "running");
      const wfSql = await fetch("/migrations/0006_workflows.sql").then((r) => r.text());
      await runSql(wfSql, "Workflow engine");
      setStep("workflows", "done");

      // Step 7 — verify via anon REST
      setStep("verify", "running");
      const { count, error } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true });
      if (error || !count) throw new Error("Verification failed — services table empty");
      setStep("verify", "done");

      toast.success("Database initialised. Welcome to your Founder OS.");
      setTimeout(() => navigate("/register"), 1200);
    } catch (err) {
      setSteps((arr) => arr.map((s) => (s.status === "running" ? { ...s, status: "error" } : s)));
      setErrorDetail(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking database…
      </div>
    );
  }

  if (alreadyReady) {
    return (
      <div className="max-w-md mx-auto px-6 py-32 text-center" data-testid="setup-already-ready">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center mb-6">
          <Check className="w-6 h-6 text-emerald-500" />
        </div>
        <h1 className="font-display text-3xl font-bold">Already set up.</h1>
        <p className="text-muted-foreground mt-3">
          Your Supabase database is initialised. No further setup needed.
        </p>
        <div className="mt-6 flex gap-2 justify-center">
          <Link to="/" className="underline text-sm">Go to homepage</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/login" className="underline text-sm">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16" data-testid="setup-page">
      <div className="flex items-center gap-3 mb-6">
        <img src={FOUNDER.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
        <div>
          <div className="label-mono">Founder OS · One-time setup</div>
          <div className="font-display font-bold">Welcome, Shamim.</div>
        </div>
      </div>

      <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter leading-[1]">
        Initialize your database<br /> with one tap.
      </h1>
      <p className="mt-4 text-muted-foreground">
        Paste a Supabase Personal Access Token and we'll create every table, policy and seed content for you. No SQL editor, no terminal.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display font-semibold">Where to get the token</div>
            <ol className="text-sm text-muted-foreground mt-1 space-y-1 list-decimal pl-4">
              <li>Open <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noreferrer" className="underline text-foreground inline-flex items-center gap-1">supabase.com/dashboard/account/tokens <ExternalLink className="w-3 h-3" /></a></li>
              <li>Tap <strong>"Generate new token"</strong>, name it <span className="font-mono text-foreground">founder-os-setup</span>, tap Generate.</li>
              <li>Copy the token that starts with <span className="font-mono text-foreground">sbp_…</span> — it's only shown once.</li>
              <li>Paste it below. The token never leaves your browser unencrypted and is not stored anywhere.</li>
            </ol>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4" data-testid="setup-form">
          <div>
            <Label>Project</Label>
            <div className="font-mono text-xs bg-secondary/40 rounded-md px-3 py-2 mt-1 border border-border" data-testid="setup-project">
              {projectRef || "(REACT_APP_SUPABASE_URL not set)"}
            </div>
          </div>
          <div>
            <Label htmlFor="pat">Supabase Personal Access Token</Label>
            <Input
              id="pat"
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="sbp_…"
              autoComplete="off"
              required
              data-testid="setup-pat-input"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={busy || !pat.trim() || !projectRef}
            className="w-full"
            data-testid="setup-submit-button"
          >
            {busy ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up…</>) : (<><Sparkles className="w-4 h-4 mr-2" />Initialize database</>)}
          </Button>
        </form>

        <div className="mt-6 space-y-2 border-t border-border pt-5" data-testid="setup-steps">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-3 text-sm">
              <StatusDot status={s.status} />
              <span className={s.status === "done" ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
            </div>
          ))}
        </div>

        {errorDetail && (
          <div className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4" data-testid="setup-error">
            <div className="flex items-center gap-2 font-semibold text-rose-500 text-sm mb-2">
              <AlertTriangle className="w-4 h-4" /> Setup error
            </div>
            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80 overflow-x-auto">{errorDetail}</pre>
            <p className="text-xs text-muted-foreground mt-3">
              Most common cause: token doesn't have access to this project. Make sure you generated the token while logged into the same Supabase account that owns this project.
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        The token is sent directly from your browser to <code className="font-mono">api.supabase.com</code>. It is never logged, stored or sent to any third-party server.
      </p>
    </div>
  );
}

function StatusDot({ status }) {
  if (status === "done") return <Check className="w-4 h-4 text-emerald-500" />;
  if (status === "running") return <Loader2 className="w-4 h-4 animate-spin text-foreground" />;
  if (status === "error") return <AlertTriangle className="w-4 h-4 text-rose-500" />;
  return <div className="w-3.5 h-3.5 rounded-full border border-border" />;
}
