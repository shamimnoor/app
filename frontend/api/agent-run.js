// Vercel Serverless Function — POST /api/agent-run
// Non-streaming chat completion. Used by the Agent + Workflow runner.
// Body: { system, user, model?, temperature?, apiKey? }
// Response: { text } | { error }

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = (payload.apiKey || process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const system = (payload.system || "").toString();
  const user = (payload.user || "").toString().slice(0, 12000);
  const model = (payload.model || process.env.OPENAI_MODEL || "gpt-5.2").toString();
  const temperature = typeof payload.temperature === "number" ? payload.temperature : 0.7;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text().catch(() => "");
    return new Response(JSON.stringify({ error: errText.slice(0, 400) || "OpenAI request failed" }), {
      status: openaiRes.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await openaiRes.json().catch(() => ({}));
  const text = data?.choices?.[0]?.message?.content || "";
  return new Response(JSON.stringify({ text, usage: data?.usage || null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
