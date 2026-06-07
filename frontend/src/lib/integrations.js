import { supabase } from "./supabase";

/**
 * Runtime config for every third-party integration the platform uses.
 * Stored in `public.integrations` (founder-only RLS).
 *
 * Shape of `config` per integration:
 *   n8n          -> { url: string, api_key?: string }
 *   openai       -> { api_key: string, model: string }
 *   github       -> { pat: string, owner: string, repo: string }
 *   vercel       -> { api_token: string, project_id?: string, team_id?: string }
 *   google_oauth -> { enabled: boolean }
 *   domain       -> { primary_domain: string }
 */

export async function listIntegrations() {
  const { data, error } = await supabase.from("integrations").select("*");
  if (error) throw error;
  const map = {};
  (data || []).forEach((row) => { map[row.id] = row; });
  return map;
}

export async function getIntegration(id) {
  const { data } = await supabase.from("integrations").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function saveIntegration(id, config) {
  const { data, error } = await supabase
    .from("integrations")
    .upsert({ id, config, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setStatus(id, status, status_message = "") {
  await supabase
    .from("integrations")
    .update({ status, status_message, last_checked_at: new Date().toISOString() })
    .eq("id", id);
}

// --- TEST CONNECTIONS --------------------------------------------------------
export async function testN8n(config) {
  const url = (config?.url || "").replace(/\/$/, "");
  if (!url) throw new Error("URL is required");
  // n8n's /healthz endpoint
  const res = await fetch(`${url}/healthz`, { method: "GET" }).catch(() => null);
  if (!res) throw new Error("Network error — check the URL");
  if (!res.ok) throw new Error(`n8n responded ${res.status}`);
  return "Healthy";
}

export async function testOpenAI(config) {
  const key = config?.api_key?.trim();
  if (!key) throw new Error("API key required");
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI: ${res.status} ${t.slice(0, 120)}`);
  }
  const data = await res.json();
  return `${(data.data || []).length} models available`;
}

export async function testGitHub(config) {
  const pat = config?.pat?.trim();
  if (!pat) throw new Error("PAT required");
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${pat}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub: ${res.status}`);
  const u = await res.json();
  return `Logged in as ${u.login}`;
}

export async function testVercel(config) {
  const token = config?.api_token?.trim();
  if (!token) throw new Error("API token required");
  const url = config?.team_id
    ? `https://api.vercel.com/v2/user?teamId=${config.team_id}`
    : "https://api.vercel.com/v2/user";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Vercel: ${res.status}`);
  const u = await res.json();
  return `Logged in as ${u.user?.username || u.user?.email || "ok"}`;
}

// --- LIVE READS for runtime features ----------------------------------------
export async function getN8nUrl() {
  const env = process.env.REACT_APP_N8N_EMBED_URL;
  if (env && !env.includes("example.com")) return env;
  const i = await getIntegration("n8n");
  return i?.config?.url || "";
}
