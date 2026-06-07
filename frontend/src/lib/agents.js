import { supabase } from "./supabase";
import { getIntegration } from "./integrations";
import { buildContext, addMessage } from "./aiBrain";

// =============================================================================
// AGENTS — CRUD + single-agent chat runner
// =============================================================================

export async function listAgents({ activeOnly = false } = {}) {
  let q = supabase.from("ai_agents").select("*").order("sort_order").order("name");
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getAgent(id) {
  const { data, error } = await supabase.from("ai_agents").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateAgent(id, patch) {
  const { data, error } = await supabase
    .from("ai_agents")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createAgent(payload) {
  const { data, error } = await supabase.from("ai_agents").insert(payload).select().single();
  if (error) throw error;
  return data;
}

// Resolve the OpenAI API key — prefer the Integrations Hub row, fall back to env.
export async function resolveOpenAIKey() {
  try {
    const row = await getIntegration("openai");
    if (row?.config?.api_key) return { key: row.config.api_key, model: row.config.model || "" };
  } catch { /* RLS will block non-founder — that's fine */ }
  return { key: "", model: "" };
}

// =============================================================================
// CHAT RUNNER — calls /api/agent-run (Vercel function) with full system prompt
// composed from agent + brain context.
// =============================================================================
export async function runAgent({ agent, userMessage, extraContext = "", conversationId = null, useBrain = true }) {
  if (!agent) throw new Error("agent required");

  let memBlock = "";
  let knowBlock = "";
  if (useBrain) {
    const ctx = await buildContext({ query: userMessage });
    memBlock = ctx.memBlock;
    knowBlock = ctx.knowBlock;
  }

  const systemPrompt = [
    agent.system_prompt,
    memBlock ? `\n\n## Founder memory (use only when relevant)\n${memBlock}` : "",
    knowBlock ? `\n\n## Knowledge base (cite when used)\n${knowBlock}` : "",
    extraContext ? `\n\n## Additional context for this step\n${extraContext}` : "",
  ].join("");

  const { key, model } = await resolveOpenAIKey();

  // Persist user turn first (so we always have history even if the network fails).
  if (conversationId) {
    await addMessage({ conversation_id: conversationId, role: "user", content: userMessage });
  }

  const res = await fetch("/api/agent-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: systemPrompt,
      user: userMessage,
      model: model || agent.model || undefined,
      temperature: agent.temperature ?? 0.7,
      apiKey: key || undefined, // server falls back to env if blank
    }),
  });

  let output = "";
  let error = "";
  if (!res.ok) {
    error = await res.text().catch(() => "");
    output = `⚠️ Agent run failed (${res.status}). ${error.slice(0, 200)}`;
  } else {
    const json = await res.json().catch(() => ({}));
    output = json?.text || "(empty response)";
  }

  if (conversationId) {
    await addMessage({ conversation_id: conversationId, role: "assistant", content: output, agent_id: agent.id });
  }

  return { output, error };
}
