"""Backend API tests for Shamim Noor Founder OS.
Runs against the public REACT_APP_BACKEND_URL with the /api prefix.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://shamim-control-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

FOUNDER_EMAIL = "shamimnoorofficial@gmail.com"
FOUNDER_PASSWORD = "ChangeMe!2026"


# -------- Fixtures --------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def founder_token(http):
    r = http.post(f"{API}/auth/login", json={"email": FOUNDER_EMAIL, "password": FOUNDER_PASSWORD})
    assert r.status_code == 200, f"founder login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "founder"
    return data["token"]


@pytest.fixture(scope="session")
def user_creds():
    return {
        "name": "TEST User",
        "email": f"TEST_user_{uuid.uuid4().hex[:10]}@example.com",
        "password": "Passw0rd!",
    }


@pytest.fixture(scope="session")
def user_token(http, user_creds):
    r = http.post(f"{API}/auth/register", json=user_creds)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "user"
    return data["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# -------- Health --------
class TestHealth:
    def test_root(self, http):
        r = http.get(f"{API}/")
        assert r.status_code == 200
        assert r.json()["ok"] is True


# -------- Public content --------
class TestPublicContent:
    @pytest.mark.parametrize("endpoint", [
        "services", "solutions", "industries", "projects",
        "case-studies", "blog", "resources",
    ])
    def test_list_endpoint_returns_items(self, http, endpoint):
        r = http.get(f"{API}/{endpoint}")
        assert r.status_code == 200, f"{endpoint}: {r.text}"
        data = r.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) > 0, f"{endpoint} returned empty list"

    @pytest.mark.parametrize("path", [
        "projects/northwind-agency-os",
        "case-studies/how-northwind-cut-delivery-time-by-38",
        "blog/the-founder-os-what-it-is-and-why-every-operator-needs-one",
    ])
    def test_detail_endpoint_increments_views(self, http, path):
        r1 = http.get(f"{API}/{path}")
        assert r1.status_code == 200, f"{path}: {r1.text}"
        v1 = r1.json().get("views", 0)
        r2 = http.get(f"{API}/{path}")
        v2 = r2.json().get("views", 0)
        assert v2 > v1, f"views did not increment for {path}: {v1} -> {v2}"


# -------- Auth --------
class TestAuth:
    def test_register_duplicate_returns_409(self, http, user_creds, user_token):
        # user already registered via fixture
        r = http.post(f"{API}/auth/register", json=user_creds)
        assert r.status_code == 409

    def test_founder_login_returns_founder_role(self, http):
        r = http.post(f"{API}/auth/login", json={"email": FOUNDER_EMAIL, "password": FOUNDER_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["role"] == "founder"
        assert isinstance(d["token"], str) and len(d["token"]) > 10

    def test_user_login_returns_user_role(self, http, user_creds, user_token):
        r = http.post(f"{API}/auth/login", json={"email": user_creds["email"], "password": user_creds["password"]})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "user"

    def test_me_with_token(self, http, user_token):
        r = http.get(f"{API}/auth/me", headers=auth(user_token))
        assert r.status_code == 200
        assert "user" in r.json()

    def test_me_without_token_401(self, http):
        r = http.get(f"{API}/auth/me")
        assert r.status_code == 401


# -------- Social --------
class TestSocial:
    def test_like_toggle_anonymous(self, http):
        payload = {"content_type": "blog", "content_id": f"TEST_{uuid.uuid4().hex[:8]}"}
        r1 = http.post(f"{API}/social/like", json=payload)
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["liked"] is True
        c1 = d1["count"]
        r2 = http.post(f"{API}/social/like", json=payload)
        d2 = r2.json()
        assert d2["liked"] is False
        assert d2["count"] == c1 - 1

    def test_social_stats(self, http):
        r = http.get(f"{API}/social/stats", params={"content_type": "blog", "content_id": "shamim-control-hub"})
        assert r.status_code == 200
        d = r.json()
        for k in ("likes", "liked", "bookmarked", "comments"):
            assert k in d

    def test_bookmark_requires_auth(self, http):
        r = http.post(f"{API}/social/bookmark", json={"content_type": "blog", "content_id": "x"})
        assert r.status_code == 401

    def test_bookmark_toggle_with_token(self, http, user_token):
        payload = {"content_type": "blog", "content_id": f"TEST_{uuid.uuid4().hex[:8]}", "title": "TEST"}
        r1 = http.post(f"{API}/social/bookmark", json=payload, headers=auth(user_token))
        assert r1.status_code == 200 and r1.json()["bookmarked"] is True
        r2 = http.post(f"{API}/social/bookmark", json=payload, headers=auth(user_token))
        assert r2.json()["bookmarked"] is False

    def test_comment_requires_auth(self, http):
        r = http.post(f"{API}/social/comments", json={"content_type": "blog", "content_id": "x", "body": "hi"})
        assert r.status_code == 401

    def test_comment_create_and_list(self, http, user_token):
        cid = f"TEST_{uuid.uuid4().hex[:8]}"
        body = f"TEST_comment_{uuid.uuid4().hex[:6]}"
        r = http.post(f"{API}/social/comments", json={"content_type": "blog", "content_id": cid, "body": body}, headers=auth(user_token))
        assert r.status_code == 200
        assert r.json()["body"] == body
        r2 = http.get(f"{API}/social/comments", params={"content_type": "blog", "content_id": cid})
        assert r2.status_code == 200
        bodies = [c["body"] for c in r2.json()["items"]]
        assert body in bodies


# -------- Leads --------
class TestLeads:
    def test_create_lead_no_auth(self, http):
        r = http.post(f"{API}/leads", json={
            "name": "TEST Lead", "email": "TEST_lead@example.com",
            "message": "Hello", "source": "contact"
        })
        assert r.status_code == 200
        assert r.json()["ok"] is True
        assert r.json()["lead"]["status"] == "new"

    def test_admin_leads_requires_founder(self, http):
        r = http.get(f"{API}/admin/leads")
        assert r.status_code == 401

    def test_admin_leads_with_founder(self, http, founder_token):
        r = http.get(f"{API}/admin/leads", headers=auth(founder_token))
        assert r.status_code == 200
        assert isinstance(r.json()["items"], list)

    def test_admin_leads_user_token_forbidden(self, http, user_token):
        r = http.get(f"{API}/admin/leads", headers=auth(user_token))
        assert r.status_code == 403

    def test_admin_update_lead_status(self, http, founder_token):
        # Create a lead first
        c = http.post(f"{API}/leads", json={
            "name": "TEST CRM", "email": "TEST_crm@example.com",
            "message": "crm test", "source": "contact"
        })
        lid = c.json()["lead"]["id"]
        r = http.patch(f"{API}/admin/leads/{lid}", json={"status": "qualified"}, headers=auth(founder_token))
        assert r.status_code == 200
        # verify persisted
        ls = http.get(f"{API}/admin/leads", headers=auth(founder_token)).json()["items"]
        match = [x for x in ls if x["id"] == lid]
        assert match and match[0]["status"] == "qualified"


# -------- Messages --------
class TestMessages:
    def test_user_send_and_list(self, http, user_token):
        body = f"TEST_msg_{uuid.uuid4().hex[:6]}"
        r = http.post(f"{API}/messages", json={"body": body, "to_founder": True}, headers=auth(user_token))
        assert r.status_code == 200
        r2 = http.get(f"{API}/messages", headers=auth(user_token))
        assert r2.status_code == 200
        msgs = r2.json().get("messages", [])
        bodies = [m["body"] for m in msgs]
        assert body in bodies

    def test_founder_grouped_threads(self, http, founder_token):
        r = http.get(f"{API}/messages", headers=auth(founder_token))
        assert r.status_code == 200
        assert "threads" in r.json()
        assert isinstance(r.json()["threads"], list)


# -------- Founder CMS --------
class TestFounderCMS:
    def test_blog_crud(self, http, founder_token):
        title = f"TEST Post {uuid.uuid4().hex[:6]}"
        r = http.post(f"{API}/admin/blog", json={
            "title": title, "excerpt": "e", "body": "b", "tags": ["t"], "category": "General", "status": "published"
        }, headers=auth(founder_token))
        assert r.status_code == 200
        post = r.json()
        assert post["slug"]
        pid = post["id"]
        # patch
        r2 = http.patch(f"{API}/admin/blog/{pid}", json={"title": title + " v2"}, headers=auth(founder_token))
        assert r2.status_code == 200
        # delete
        r3 = http.delete(f"{API}/admin/blog/{pid}", headers=auth(founder_token))
        assert r3.status_code == 200

    def test_projects_crud(self, http, founder_token):
        title = f"TEST Project {uuid.uuid4().hex[:6]}"
        r = http.post(f"{API}/admin/projects", json={
            "title": title, "summary": "s", "body": "b", "tags": [], "status": "published"
        }, headers=auth(founder_token))
        assert r.status_code == 200
        pid = r.json()["id"]
        r2 = http.patch(f"{API}/admin/projects/{pid}", json={"summary": "s2"}, headers=auth(founder_token))
        assert r2.status_code == 200
        r3 = http.delete(f"{API}/admin/projects/{pid}", headers=auth(founder_token))
        assert r3.status_code == 200


# -------- Founder Overview / Analytics / Command --------
class TestFounderOps:
    def test_overview(self, http, founder_token):
        r = http.get(f"{API}/admin/overview", headers=auth(founder_token))
        assert r.status_code == 200
        kpis = r.json()["kpis"]
        for k in ("users", "leads", "projects", "revenue", "messages", "comments", "likes", "views"):
            assert k in kpis

    def test_analytics(self, http, founder_token):
        r = http.get(f"{API}/admin/analytics", headers=auth(founder_token))
        assert r.status_code == 200
        d = r.json()
        assert len(d["series"]) == 14
        assert isinstance(d["sources"], list)

    def test_command_show_leads(self, http, founder_token):
        r = http.post(f"{API}/admin/command", json={"prompt": "show leads"}, headers=auth(founder_token))
        assert r.status_code == 200
        d = r.json()
        assert d["intent"] == "list_leads"
        assert isinstance(d["result"], list)

    def test_command_show_analytics(self, http, founder_token):
        r = http.post(f"{API}/admin/command", json={"prompt": "show analytics"}, headers=auth(founder_token))
        assert r.status_code == 200
        assert r.json()["intent"] == "analytics"


# -------- Copilot SSE --------
class TestCopilot:
    def test_copilot_stream_sse(self):
        start = time.time()
        with requests.post(
            f"{API}/copilot/stream",
            json={"message": "Say hi in 5 words."},
            stream=True,
            timeout=40,
            headers={"Content-Type": "application/json"},
        ) as r:
            assert r.status_code == 200
            ctype = r.headers.get("content-type", "")
            assert "text/event-stream" in ctype, f"unexpected content type: {ctype}"
            first_chunk_time = None
            collected = []
            for raw in r.iter_lines(decode_unicode=True):
                if raw is None:
                    continue
                if raw:
                    if first_chunk_time is None:
                        first_chunk_time = time.time() - start
                    collected.append(raw)
                    if "[DONE]" in raw:
                        break
                if time.time() - start > 35:
                    break
            assert first_chunk_time is not None and first_chunk_time < 25, f"no chunk in 25s ({first_chunk_time})"
            assert any(line.startswith("data:") for line in collected)
            assert any("[DONE]" in line for line in collected)


# -------- Community --------
class TestCommunity:
    def test_list_no_auth(self, http):
        r = http.get(f"{API}/community/posts")
        assert r.status_code == 200
        assert "items" in r.json()

    def test_post_requires_auth(self, http):
        r = http.post(f"{API}/community/posts", json={"body": "hi"})
        assert r.status_code == 401

    def test_post_with_token(self, http, user_token):
        body = f"TEST_community_{uuid.uuid4().hex[:6]}"
        r = http.post(f"{API}/community/posts", json={"body": body}, headers=auth(user_token))
        assert r.status_code == 200
        assert r.json()["body"] == body
