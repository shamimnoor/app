import { supabase } from "./supabase";

// =============================================================================
// AI BRAIN — Memory, Knowledge, Conversations
// All tables are founder-only via RLS, so anon callers will simply see nothing.
// =============================================================================

// ----- MEMORY ---------------------------------------------------------------
export async function listMemory({ kind, tag, search } = {}) {
  let q = supabase.from("ai_memory").select("*").order("updated_at", { ascending: false });
  if (kind) q = q.eq("kind", kind);
  if (tag) q = q.contains("tags", [tag]);
  if (search) q = q.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createMemory(payload) {
  const row = {
    kind: payload.kind || "note",
    title: payload.title || "",
    content: payload.content,
    tags: payload.tags || [],
    importance: payload.importance ?? 3,
    source: payload.source || "manual",
  };
  const { data, error } = await supabase.from("ai_memory").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateMemory(id, patch) {
  const { data, error } = await supabase
    .from("ai_memory")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMemory(id) {
  const { error } = await supabase.from("ai_memory").delete().eq("id", id);
  if (error) throw error;
}

// ----- KNOWLEDGE (RAG) ------------------------------------------------------
export async function listKnowledge({ source_type, search } = {}) {
  let q = supabase.from("ai_knowledge").select("*").order("updated_at", { ascending: false });
  if (source_type) q = q.eq("source_type", source_type);
  if (search) q = q.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createKnowledge(payload) {
  const row = {
    title: payload.title,
    source_type: payload.source_type || "doc",
    source_url: payload.source_url || "",
    content: payload.content,
    tags: payload.tags || [],
  };
  const { data, error } = await supabase.from("ai_knowledge").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function deleteKnowledge(id) {
  const { error } = await supabase.from("ai_knowledge").delete().eq("id", id);
  if (error) throw error;
}

// Lexical text-search via the search_knowledge() RPC.
export async function searchKnowledge(query, maxRows = 5) {
  if (!query?.trim()) return [];
  const { data, error } = await supabase.rpc("search_knowledge", { q: query, max_rows: maxRows });
  if (error) throw error;
  return data || [];
}

// ----- CONVERSATIONS --------------------------------------------------------
export async function listConversations(limit = 30) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createConversation({ title = "Untitled", agent_id = null, workflow_id = null, meta = {} } = {}) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({ title, agent_id, workflow_id, meta })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listMessages(conversation_id) {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addMessage({ conversation_id, role, content, agent_id = null, tokens = 0 }) {
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({ conversation_id, role, content, agent_id, tokens })
    .select()
    .single();
  if (error) throw error;
  // bump conversation updated_at + last agent
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString(), agent_id: agent_id || undefined })
    .eq("id", conversation_id);
  return data;
}

// ----- BRAIN CONTEXT BUILDER ------------------------------------------------
// Compose memory + retrieved knowledge into a system prompt addendum.
export async function buildContext({ query, maxMemory = 8, maxKnowledge = 4 } = {}) {
  const [{ data: mem }, knowledge] = await Promise.all([
    supabase
      .from("ai_memory")
      .select("kind,title,content,importance")
      .order("importance", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(maxMemory),
    query ? searchKnowledge(query, maxKnowledge) : Promise.resolve([]),
  ]);
  const memBlock = (mem || [])
    .map((m) => `• [${m.kind}${m.title ? ` · ${m.title}` : ""}] ${m.content}`)
    .join("\n");
  const knowBlock = (knowledge || [])
    .map((k) => `### ${k.title}\n${k.content}`)
    .join("\n\n");
  return { memBlock, knowBlock, memory: mem || [], knowledge };
}
