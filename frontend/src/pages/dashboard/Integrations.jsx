import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Sparkles, Github, Triangle, KeyRound, Globe, Check, Loader2, AlertTriangle,
  ExternalLink, Plug, Database as DatabaseIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  listIntegrations, saveIntegration, setStatus,
  testN8n, testOpenAI, testGitHub, testVercel,
} from "@/lib/integrations";

const SERVICES = [
  {
    id: "n8n", name: "n8n Automation", icon: Zap, accent: "amber",
    blurb: "URL of your n8n editor (cloud or self-hosted). Embedded in Automation Center.",
    fields: [
      { key: "url", label: "n8n URL", placeholder: "https://yourname.app.n8n.cloud", type: "text" },
      { key: "api_key", label: "API key (optional, for webhooks)", type: "password", optional: true },
    ],
    helpUrl: "https://n8n.cloud",
    helpLabel: "Get n8n",
    tester: testN8n,
  },
  {
    id: "openai", name: "OpenAI / AI Copilot", icon: Sparkles, accent: "emerald",
    blurb: "Powers the AI Copilot chat widget. Streams GPT responses via the Vercel function.",
    fields: [
      { key: "api_key", label: "OpenAI API key", placeholder: "sk-proj-…", type: "password" },
      { key: "model", label: "Model", placeholder: "gpt-5.2", type: "text" },
    ],
    helpUrl: "https://platform.openai.com/api-keys",
    helpLabel: "Get key",
    tester: testOpenAI,
  },
  {
    id: "github", name: "GitHub", icon: Github, accent: "slate",
    blurb: "Connect a repo for read-only stats. Push from your machine — never from browser.",
    fields: [
      { key: "pat", label: "Personal Access Token", placeholder: "ghp_…", type: "password" },
      { key: "owner", label: "Owner / username", placeholder: "shamimnoor", type: "text" },
      { key: "repo", label: "Repository", placeholder: "founder-os", type: "text" },
    ],
    helpUrl: "https://github.com/settings/tokens/new?scopes=repo,read:user",
    helpLabel: "Create token",
    tester: testGitHub,
  },
  {
    id: "vercel", name: "Vercel", icon: Triangle, accent: "blue",
    blurb: "Read-only deployment info from the Vercel API.",
    fields: [
      { key: "api_token", label: "Vercel API token", placeholder: "VRC-…", type: "password" },
      { key: "project_id", label: "Project ID (optional)", optional: true, type: "text" },
      { key: "team_id", label: "Team ID (optional)", optional: true, type: "text" },
    ],
    helpUrl: "https://vercel.com/account/tokens",
    helpLabel: "Create token",
    tester: testVercel,
  },
  {
    id: "google_oauth", name: "Google OAuth", icon: KeyRound, accent: "rose",
    blurb: "Enable 'Continue with Google' on Login/Register. Configured in Supabase Auth.",
    fields: [
      { key: "enabled", label: "Enabled in Supabase", type: "switch" },
    ],
    helpUrl: "https://supabase.com/dashboard/project/_/auth/providers",
    helpLabel: "Open Supabase",
    tester: null,
  },
  {
    id: "domain", name: "Custom Domain", icon: Globe, accent: "violet",
    blurb: "Primary domain for the production site (e.g. shamimnoor.dev). Set in Vercel Domains.",
    fields: [
      { key: "primary_domain", label: "Primary domain", placeholder: "shamimnoor.dev", type: "text" },
    ],
    helpUrl: "https://vercel.com/dashboard/domains",
    helpLabel: "Open Vercel Domains",
    tester: null,
  },
];

const ACCENT = {
  amber: "bg-amber-500/15 text-amber-500",
  emerald: "bg-emerald-500/15 text-emerald-500",
  slate: "bg-slate-500/15 text-slate-400",
  blue: "bg-blue-500/15 text-blue-500",
  rose: "bg-rose-500/15 text-rose-500",
  violet: "bg-violet-500/15 text-violet-500",
};

export default function Integrations() {
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listIntegrations();
      setItems(data);
      setMissingTable(false);
    } catch (e) {
      if (String(e?.message || "").includes("relation")) setMissingTable(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (missingTable) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6" data-testid="integrations-missing-table">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <div className="font-display text-lg font-semibold">Integrations table not found</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              The Integrations Hub needs migration <code className="font-mono">0003_integrations.sql</code>. Open <a className="underline text-foreground" href="/dashboard/database">Database</a> and run the schema migration to install it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-integrations">
      <div>
        <div className="label-mono">Integrations Hub</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">All services in one place</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure n8n, OpenAI, GitHub, Vercel, Google OAuth and your custom domain. Credentials live in Supabase under founder-only RLS.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground"><Loader2 className="w-4 h-4 inline mr-2 animate-spin" /> Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((svc) => (
            <IntegrationCard key={svc.id} service={svc} row={items[svc.id]} onSaved={load} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6" data-testid="integrations-supabase">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-md bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <DatabaseIcon className="w-4 h-4" />
          </div>
          <h3 className="font-display font-semibold">Supabase (database + auth)</h3>
          <Badge className="ml-auto" variant="outline"><Check className="w-3 h-3 mr-1" /> Connected</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Already wired via <code className="font-mono">REACT_APP_SUPABASE_URL</code> + anon key in Vercel env vars. Use the <a className="underline text-foreground" href="/dashboard/database">Database</a> tab to manage tables.
        </p>
      </div>
    </div>
  );
}

function IntegrationCard({ service, row, onSaved }) {
  const Icon = service.icon;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [form, setForm] = useState({});
  const status = row?.status || "disconnected";
  const accent = ACCENT[service.accent] || ACCENT.slate;
  const isConfigured =
    row?.config &&
    Object.keys(row.config).length > 0 &&
    service.fields.some((f) => !f.optional && row.config[f.key]);

  useEffect(() => {
    if (open) setForm({ ...(row?.config || {}) });
  }, [open, row]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const test = async (config) => {
    if (!service.tester) return;
    setTesting(true); setTestResult(null);
    try {
      const msg = await service.tester(config);
      setTestResult({ ok: true, msg });
    } catch (e) {
      setTestResult({ ok: false, msg: e.message || String(e) });
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await saveIntegration(service.id, form);
      let newStatus = "connected";
      let msg = "";
      if (service.tester) {
        try { msg = await service.tester(form); } catch (e) { newStatus = "error"; msg = e.message; }
      }
      await setStatus(service.id, newStatus, msg);
      toast.success(`${service.name} saved.`);
      setOpen(false);
      onSaved?.();
    } catch (e) {
      toast.error(e?.message || "Could not save");
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col" data-testid={`integration-card-${service.id}`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold leading-tight">{service.name}</div>
          <StatusBadge status={status} configured={isConfigured} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{service.blurb}</p>

      <div className="mt-auto pt-4 flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex-1" data-testid={`integration-configure-${service.id}`}>
              <Plug className="w-3.5 h-3.5 mr-1.5" /> Configure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Icon className="w-4 h-4" />{service.name}</DialogTitle>
              <DialogDescription>{service.blurb}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {service.fields.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  {f.type === "switch" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Switch
                        checked={!!form[f.key]}
                        onCheckedChange={(v) => setField(f.key, v)}
                        data-testid={`integration-${service.id}-${f.key}`}
                      />
                      <span className="text-sm text-muted-foreground">{form[f.key] ? "On" : "Off"}</span>
                    </div>
                  ) : (
                    <Input
                      type={f.type === "password" ? "password" : "text"}
                      value={form[f.key] || ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder || ""}
                      autoComplete="off"
                      data-testid={`integration-${service.id}-${f.key}`}
                    />
                  )}
                </div>
              ))}
              {testResult && (
                <div className={`rounded-md p-3 text-xs font-mono ${testResult.ok ? "border border-emerald-500/30 bg-emerald-500/10" : "border border-rose-500/30 bg-rose-500/10"}`} data-testid={`integration-${service.id}-test-result`}>
                  {testResult.ok ? "✅ " : "❌ "}{testResult.msg}
                </div>
              )}
              <div className="text-xs">
                <a href={service.helpUrl} target="_blank" rel="noreferrer" className="text-muted-foreground underline inline-flex items-center gap-1">
                  {service.helpLabel} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              {service.tester && (
                <Button variant="outline" onClick={() => test(form)} disabled={testing} data-testid={`integration-${service.id}-test`}>
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null} Test connection
                </Button>
              )}
              <Button onClick={save} disabled={busy} data-testid={`integration-${service.id}-save`}>
                {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Saving…</> : <><Check className="w-3.5 h-3.5 mr-2" />Save</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" asChild>
          <a href={service.helpUrl} target="_blank" rel="noreferrer" aria-label={`Open ${service.name}`}>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status, configured }) {
  if (status === "connected") return <Badge variant="outline" className="mt-0.5 text-[10px] border-emerald-500/30 text-emerald-500"><Check className="w-2.5 h-2.5 mr-1" />Connected</Badge>;
  if (status === "error") return <Badge variant="outline" className="mt-0.5 text-[10px] border-rose-500/30 text-rose-500"><AlertTriangle className="w-2.5 h-2.5 mr-1" />Error</Badge>;
  if (configured) return <Badge variant="outline" className="mt-0.5 text-[10px]">Configured · untested</Badge>;
  return <Badge variant="outline" className="mt-0.5 text-[10px] text-muted-foreground">Not configured</Badge>;
}
