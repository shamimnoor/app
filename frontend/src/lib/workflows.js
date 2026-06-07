import { supabase } from "./supabase";
import { runAgent, getAgent } from "./agents";
import { createConversation } from "./aiBrain";

// =============================================================================
// WORKFLOWS — CRUD + sequential multi-agent runner
// =============================================================================

export async function listWorkflows({ activeOnly = false } = {}) {
  let q = supabase.from("ai_workflows").select("*").order("sort_order").order("name");
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getWorkflow(idOrSlug) {
  // Try id first, then slug
  let q = supabase.from("ai_workflows").select("*");
  if (idOrSlug?.includes("-")) {
    // slug-like
    const { data } = await q.eq("slug", idOrSlug).maybeSingle();
    if (data) return data;
  }
  const { data, error } = await supabase.from("ai_workflows").select("*").eq("id", idOrSlug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createWorkflow(payload) {
  const { data, error } = await supabase.from("ai_workflows").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateWorkflow(id, patch) {
  const { data, error } = await supabase
    .from("ai_workflows")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkflow(id) {
  const { error } = await supabase.from("ai_workflows").delete().eq("id", id);
  if (error) throw error;
}

export async function listRuns(workflowId, limit = 20) {
  let q = supabase.from("ai_workflow_runs").select("*").order("started_at", { ascending: false }).limit(limit);
  if (workflowId) q = q.eq("workflow_id", workflowId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// Run a workflow sequentially. Each step's output becomes part of the next step's
// extra context. `onStep` receives partial progress so the UI can stream updates.
export async function runWorkflow({ workflow, input, onStep }) {
  if (!workflow) throw new Error("workflow required");

  // Create conversation + run rows
  const conv = await createConversation({
    title: `Workflow: ${workflow.name}`,
    workflow_id: workflow.id,
  });
  const { data: runRow, error: runErr } = await supabase
    .from("ai_workflow_runs")
    .insert({
      workflow_id: workflow.id,
      input,
      status: "running",
      conversation_id: conv.id,
    })
    .select()
    .single();
  if (runErr) throw runErr;

  const stepsOut = [];
  let accumulated = "";
  try {
    for (let i = 0; i < (workflow.steps || []).length; i++) {
      const step = workflow.steps[i];
      const agent = await getAgent(step.agent_id);
      const startedAt = new Date().toISOString();

      const stepInput =
        i === 0
          ? `User request:\n${input}\n\n${step.instructions || ""}`
          : `Original request:\n${input}\n\nPrevious step output:\n${accumulated}\n\nYour task:\n${step.instructions || ""}`;

      const { output } = await runAgent({
        agent,
        userMessage: stepInput,
        conversationId: conv.id,
        useBrain: i === 0, // brain context only on the first step to save tokens
      });
      accumulated = output;

      const stepResult = {
        agent_id: step.agent_id,
        agent_name: agent?.name || step.agent_id,
        agent_emoji: agent?.emoji || "",
        instructions: step.instructions || "",
        output,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      };
      stepsOut.push(stepResult);
      onStep?.(stepResult, i);

      await supabase.from("ai_workflow_runs").update({ steps_output: stepsOut }).eq("id", runRow.id);
    }

    await supabase
      .from("ai_workflow_runs")
      .update({ status: "completed", completed_at: new Date().toISOString(), steps_output: stepsOut })
      .eq("id", runRow.id);
    return { run: { ...runRow, steps_output: stepsOut, status: "completed" }, conversation: conv };
  } catch (e) {
    await supabase
      .from("ai_workflow_runs")
      .update({ status: "failed", error: String(e?.message || e), completed_at: new Date().toISOString(), steps_output: stepsOut })
      .eq("id", runRow.id);
    throw e;
  }
}
