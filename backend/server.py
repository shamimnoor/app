"""
Shamim Noor — Founder OS · Backend SHIM (Emergent preview only)
================================================================
This minimal FastAPI service exists solely so the Emergent preview keeps
working while the **production** stack runs on Vercel + Supabase.

It exposes a single endpoint that mirrors the Vercel Edge function:
  POST /api/copilot       — streams the AI Copilot reply (SSE)

All data access has moved to Supabase via the frontend (@supabase/supabase-js),
so the FastAPI side no longer owns auth, content, leads, messages, etc.

Production deployment on Vercel does NOT use this file.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.2")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("shim")

app = FastAPI(title="Shamim Noor Preview Shim", docs_url="/api/docs", openapi_url="/api/openapi.json")

SYSTEM_PROMPT = """You are Noor — the AI copilot for Shamim Noor's platform.

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

Tone: confident, concise, premium, friendly. Format with short paragraphs and the occasional bullet list. Never invent client names. If asked something outside Shamim's scope, gently redirect to what he does."""


def sse_line(text: str) -> bytes:
    return f"data: {text.replace(chr(10), chr(92) + 'n')}\n\n".encode("utf-8")


async def stream_openai(message: str, model: str):
    if not OPENAI_API_KEY:
        yield sse_line("Copilot offline (OPENAI_API_KEY not configured in /app/backend/.env).")
        yield b"data: [DONE]\n\n"
        return

    payload = {
        "model": model,
        "stream": True,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ],
    }
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, read=60.0)) as client:
            async with client.stream(
                "POST", "https://api.openai.com/v1/chat/completions", json=payload, headers=headers
            ) as resp:
                if resp.status_code != 200:
                    err = await resp.aread()
                    yield sse_line(f"Copilot error: {resp.status_code} {err.decode('utf-8', 'ignore')[:200]}")
                    yield b"data: [DONE]\n\n"
                    return
                async for raw in resp.aiter_lines():
                    line = raw.strip()
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        yield b"data: [DONE]\n\n"
                        continue
                    try:
                        obj = json.loads(data)
                        delta = (obj.get("choices") or [{}])[0].get("delta", {}).get("content")
                        if delta:
                            yield sse_line(delta)
                    except Exception:
                        continue
    except Exception as e:
        logger.exception("copilot stream error")
        yield sse_line(f"\n(stream error: {e})")
        yield b"data: [DONE]\n\n"


@app.post("/api/copilot")
async def copilot(req: Request):
    payload: dict[str, Any] = await req.json()
    message = str(payload.get("message", "")).strip()[:4000]
    if not message:
        raise HTTPException(status_code=400, detail="message required")
    model = str(payload.get("model") or OPENAI_MODEL)
    return StreamingResponse(
        stream_openai(message, model),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# Backward-compat alias so any old client hitting /api/copilot/stream still works
@app.post("/api/copilot/stream")
async def copilot_alias(req: Request):
    return await copilot(req)


@app.get("/api/")
async def root():
    return {"ok": True, "service": "shamim-noor-shim", "note": "Production uses Vercel + Supabase."}


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
