// Vercel Edge Function — POST /api/copilot
// Streams an AI Copilot reply (server-sent events) via OpenAI directly.
// Works on Vercel Hobby tier (Edge functions support streaming).

export const config = { runtime: "edge" };

const SYSTEM_PROMPT = `You are Noor — the AI copilot for Shamim Noor's platform.

Shamim Noor is a Business Systems Builder, Automation Architect, Agency Founder and Digital Solutions Consultant. He helps businesses build websites, CRM systems, client portals, dashboards, automation systems and modern business infrastructure.

His services include:
- Business Systems Design (from $4,800)
- Automation Architecture with n8n + AI (from $2,400)
- Client Portals & Dashboards (from $3,600)
- CRM & Pipeline Engineering (from $2,800)
- AI Copilots & Knowledge bases (from $3,200)
- Modern Web Experiences (from $3,000)

He serves SaaS, agencies, e-commerce, finance, healthcare, education, real estate and creators.

Your job:
1. Answer visitor questions warmly and concisely.
2. Explain Shamim's services and which fits the visitor's situation.
3. Qualify leads — ask about their company, goal, timeline and budget when relevant.
4. Suggest a free 20-minute consult when a visitor seems serious.
5. If asked to draft proposals, project summaries or recommendations, do it crisply.

Tone: confident, concise, premium, friendly. Format with short paragraphs and the occasional bullet list. Never invent client names. If asked something outside Shamim's scope, gently redirect to what he does.`;

function sseLine(text) {
  // Escape newlines so the SSE wire stays single-line per chunk; frontend re-expands \n.
  return `data: ${text.replace(/\n/g, "\\n")}\n\n`;
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("OPENAI_API_KEY not configured", { status: 500 });
  }

  let payload = {};
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const message = (payload.message || "").toString().slice(0, 4000);
  const model = (payload.model || process.env.OPENAI_MODEL || "gpt-5.2").toString();

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    }),
  });

  if (!openaiRes.ok || !openaiRes.body) {
    const errText = await openaiRes.text().catch(() => "");
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(
          sseLine(`Sorry — the copilot is offline. ${errText.slice(0, 200)}`)
        ));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  // Transform OpenAI SSE → our simple {data: <chunk>}\n\n format.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const transformed = new ReadableStream({
    async start(controller) {
      const reader = openaiRes.body.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(sseLine(delta)));
            } catch {
              // ignore non-JSON lines
            }
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode(sseLine(`\n(stream error: ${e.message || e})`)));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(transformed, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
