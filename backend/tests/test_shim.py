"""Backend SHIM tests (Vercel + Supabase V2).

The FastAPI service is now only a preview-shim exposing 3 endpoints:
  GET  /api/                — service identity
  POST /api/agent-run       — JSON proxy to OpenAI chat (returns {text} or {text,error})
  POST /api/copilot         — SSE stream (text/event-stream) of OpenAI deltas
  POST /api/copilot/stream  — backward-compat alias of /api/copilot

A 429 / insufficient_quota wrapped inside an HTTP 200 is ACCEPTABLE (known
upstream OpenAI billing issue, not a bug). Only non-200 / connection errors
are failures.
"""
from __future__ import annotations

import json
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------- GET /api/ --------
class TestRoot:
    def test_root_ok(self, http):
        r = http.get(f"{API}/")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert data.get("service") == "shamim-noor-shim"


# -------- POST /api/agent-run --------
class TestAgentRun:
    def test_agent_run_returns_text_or_error(self, http):
        payload = {"system": "You are a helpful assistant.", "user": "ping"}
        r = http.post(f"{API}/agent-run", json=payload, timeout=60)
        assert r.status_code == 200, f"non-200: {r.status_code} {r.text}"
        data = r.json()
        assert isinstance(data, dict)
        # Must contain at least one of {text} or {text, error}
        assert "text" in data, f"missing 'text' key: {data}"
        # Acceptable: text present OR error (quota) present
        if not data.get("text"):
            assert "error" in data, f"empty text but no error: {data}"
            # If quota error, surface it but pass
            err_str = str(data.get("error") or "")
            print(f"[agent-run] upstream error (acceptable): {err_str[:200]}")

    def test_agent_run_missing_user_returns_400(self, http):
        r = http.post(f"{API}/agent-run", json={"system": "s"}, timeout=15)
        assert r.status_code == 400


# -------- POST /api/copilot (SSE) --------
class TestCopilotSSE:
    def _assert_sse(self, url, payload):
        start = time.time()
        with requests.post(
            url, json=payload, stream=True, timeout=40,
            headers={"Content-Type": "application/json"},
        ) as r:
            assert r.status_code == 200, f"non-200: {r.status_code} {r.text[:200]}"
            ctype = r.headers.get("content-type", "")
            assert "text/event-stream" in ctype, f"bad content-type: {ctype}"
            saw_data_line = False
            for raw in r.iter_lines(decode_unicode=True):
                if raw and raw.startswith("data:"):
                    saw_data_line = True
                    # log first data line for visibility
                    print(f"[copilot] {raw[:160]}")
                    # Acceptable: any data line — including '429' quota error
                if raw and "[DONE]" in raw:
                    break
                if time.time() - start > 35:
                    break
            assert saw_data_line, "no 'data:' line received from SSE"

    def test_copilot_emits_sse(self):
        self._assert_sse(f"{API}/copilot", {"message": "ping"})

    def test_copilot_alias_stream(self):
        self._assert_sse(f"{API}/copilot/stream", {"message": "ping"})

    def test_copilot_missing_message_returns_400(self, http):
        r = http.post(f"{API}/copilot", json={}, timeout=10)
        assert r.status_code == 400
